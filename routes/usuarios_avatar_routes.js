/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — ROTAS DE UPLOAD & GESTÃO DE AVATAR DO USUÁRIO
 * Arquivo: routes/usuarios_avatar_routes.js
 * Descrição: Upload seguro com Multer, whitelist de MIME/extensão, limite de 5MB,
 *            sanitização de nomes de arquivo e remoção de avatar.
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { getUsers, saveUsers } = require('./auth_routes');

// Garante existência da pasta de uploads de avatar
const avatarsDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(avatarsDir)) {
    try { fs.mkdirSync(avatarsDir, { recursive: true }); } catch(e) {}
}

const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, avatarsDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const cleanUserId = (req.params.id || 'user').replace(/[^a-zA-Z0-9_-]/g, '');
        const uniqueName = `avatar_${cleanUserId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
        cb(null, uniqueName);
    }
});

const uploadAvatarMiddleware = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const allowedExt = ['.jpg', '.jpeg', '.png', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedMime.includes(file.mimetype) && allowedExt.includes(ext)) {
            cb(null, true);
        } else {
            const err = new Error('Apenas arquivos de imagem (.jpg, .jpeg, .png, .webp) de até 5MB são permitidos.');
            err.code = 'INVALID_FILE_TYPE';
            cb(err, false);
        }
    }
});

// POST /api/usuarios/:id/avatar e POST /api/users/:id/avatar
router.post(['/usuarios/:id/avatar', '/users/:id/avatar'], authMiddleware, (req, res) => {
    uploadAvatarMiddleware.single('avatar')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message || 'Erro no upload da imagem.' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo de imagem foi enviado.' });
        }

        try {
            const { id } = req.params;
            const requesterId = req.user && (req.user.id || req.user.email);
            const requesterRole = (req.user && req.user.role) || '';
            const isAdmin = requesterRole.toLowerCase().includes('admin') || requesterRole.toLowerCase().includes('master');

            if (requesterId !== id && !isAdmin) {
                return res.status(403).json({ error: 'Você não tem permissão para alterar o avatar de outro usuário.' });
            }

            const avatarRelativePath = `/uploads/avatars/${req.file.filename}`;

            if (!db.useLocalFallback) {
                try {
                    await db.query(`
                        UPDATE public.usuarios 
                        SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP
                        WHERE id = $2 OR email = $2
                    `, [avatarRelativePath, id]);
                } catch(e) {
                    console.error('[DB Avatar Update Error]:', e.message);
                }
            } else {
                try {
                    if (fs.existsSync(db.LOCAL_DB_FILE)) {
                        let fileState = JSON.parse(fs.readFileSync(db.LOCAL_DB_FILE, 'utf8'));
                        Object.keys(fileState).forEach(org => {
                            if (fileState[org] && Array.isArray(fileState[org].dbUsuarios)) {
                                fileState[org].dbUsuarios.forEach(u => {
                                    if (u.id === id || (u.email && u.email.toLowerCase() === id.toLowerCase())) {
                                        u.avatar_url = avatarRelativePath;
                                        u.avatarPhoto = avatarRelativePath;
                                    }
                                });
                            }
                        });
                        fs.writeFileSync(db.LOCAL_DB_FILE, JSON.stringify(fileState, null, 2));
                    }
                } catch(e) {}
            }

            const users = getUsers();
            const userIdx = users.findIndex(u => u.id === id || (u.email && u.email.toLowerCase() === id.toLowerCase()));
            if (userIdx >= 0) {
                users[userIdx].avatar_url = avatarRelativePath;
                users[userIdx].avatarPhoto = avatarRelativePath;
                saveUsers(users);
            } else {
                users.push({
                    id: id,
                    email: id,
                    avatar_url: avatarRelativePath,
                    avatarPhoto: avatarRelativePath
                });
                saveUsers(users);
            }

            return res.json({
                success: true,
                message: 'Foto de perfil atualizada com sucesso!',
                avatar_url: avatarRelativePath,
                avatarPhoto: avatarRelativePath
            });
        } catch(uploadErr) {
            console.error('[Avatar Upload Handler Error]:', uploadErr);
            return res.status(500).json({ error: 'Erro interno ao processar avatar.' });
        }
    });
});

// DELETE /api/usuarios/:id/avatar e DELETE /api/users/:id/avatar
router.delete(['/usuarios/:id/avatar', '/users/:id/avatar'], authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const reqUserId = req.user && (req.user.id || req.user.email);
        const reqUserRole = req.user && req.user.role;
        const isAdmin = reqUserRole === 'Master Admin' || reqUserRole === 'Gestor da Rede';

        if (id !== reqUserId && req.user.email !== id && !isAdmin) {
            return res.status(403).json({ error: 'Você não tem permissão para remover o avatar de outro usuário.' });
        }

        if (!db.useLocalFallback) {
            try {
                await db.query(`
                    UPDATE public.usuarios 
                    SET avatar_url = NULL, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1 OR email = $1
                `, [id]);
            } catch(e) {
                console.error('[DB Avatar Delete Error]:', e.message);
            }
        } else {
            try {
                if (fs.existsSync(db.LOCAL_DB_FILE)) {
                    let fileState = JSON.parse(fs.readFileSync(db.LOCAL_DB_FILE, 'utf8'));
                    Object.keys(fileState).forEach(org => {
                        if (fileState[org] && Array.isArray(fileState[org].dbUsuarios)) {
                            fileState[org].dbUsuarios.forEach(u => {
                                if (u.id === id || (u.email && u.email.toLowerCase() === id.toLowerCase())) {
                                    u.avatar_url = null;
                                    u.avatarPhoto = null;
                                }
                            });
                        }
                    });
                    fs.writeFileSync(db.LOCAL_DB_FILE, JSON.stringify(fileState, null, 2));
                }
            } catch(e) {}
        }

        const users = getUsers();
        const userIdx = users.findIndex(u => u.id === id || (u.email && u.email.toLowerCase() === id.toLowerCase()));
        if (userIdx >= 0) {
            users[userIdx].avatar_url = null;
            users[userIdx].avatarPhoto = null;
            saveUsers(users);
        }

        return res.json({
            success: true,
            message: 'Foto de perfil removida com sucesso. Avatar padrão restaurado.',
            avatar_url: null,
            avatarPhoto: null
        });
    } catch(err) {
        console.error('[Avatar DELETE Handler Error]:', err);
        return res.status(500).json({ error: 'Erro ao remover foto de perfil.' });
    }
});

module.exports = {
    avatarRouter: router,
    uploadAvatarMiddleware
};
