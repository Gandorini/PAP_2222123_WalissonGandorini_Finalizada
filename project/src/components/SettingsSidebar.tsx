import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Logout as LogoutIcon,
  DeleteForever as DeleteForeverIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface SettingsSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsSidebar({ open, onClose }: SettingsSidebarProps) {
  const { signOut, user } = useAuthStore();
  const navigate = useNavigate();
  const [showDeleteProfile, setShowDeleteProfile] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ocorreu um erro ao sair.';
      setSnackbarMessage(message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDeleteProfile = async () => {
    setShowDeleteProfile(false);
    try {
      if (!user?.id) throw new Error('Utilizador não autenticado.');

      const headers: HeadersInit = { 'x-user-id': user.id };
      const res = await fetch(`${process.env.REACT_APP_API_URL || ''}/profile`, {
        method: 'DELETE',
        headers,
      });

      if (res.ok) {
        await supabase.auth.signOut();
        setSnackbarMessage('Conta excluída com sucesso!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setTimeout(() => navigate('/'), 1500);
      } else {
        const errorText = await res.text();
        throw new Error(errorText || 'Erro ao excluir conta. Tente novamente.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ocorreu um erro ao excluir conta.';
      setSnackbarMessage(message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile.
      }}
      sx={{
        width: 300,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: 300, boxSizing: 'border-box', px: 2, pt: 2 },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          Configurações
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleSignOut}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Sair" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => setShowDeleteProfile(true)}>
            <ListItemIcon>
              <DeleteForeverIcon color="error" />
            </ListItemIcon>
            <ListItemText primary="Excluir Conta" sx={{ color: 'error.main' }} />
          </ListItemButton>
        </ListItem>
        {/* Futuras opções de configuração podem ser adicionadas aqui */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => {
              // Exemplo de como adicionar mais opções, talvez um link para Profile para editar dados
              onClose();
              navigate('/profile');
            }}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Editar Perfil" />
          </ListItemButton>
        </ListItem>
      </List>

      <Dialog open={showDeleteProfile} onClose={() => setShowDeleteProfile(false)}>
        <DialogTitle>Excluir Conta</DialogTitle>
        <DialogContent>
          Tem certeza que deseja excluir sua conta? Esta ação é irreversível e apagará todos os seus dados.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteProfile(false)}>Cancelar</Button>
          <Button onClick={handleDeleteProfile} color="error" variant="contained">Excluir</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Drawer>
  );
} 