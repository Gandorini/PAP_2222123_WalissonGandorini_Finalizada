import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Avatar,
  Button,
  Tooltip,
  Badge,
  alpha,
  ListItemButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  LibraryMusic as LibraryMusicIcon,
  CloudUpload as CloudUploadIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  NotificationsOutlined as NotificationIcon,
  DarkModeOutlined as DarkModeIcon,
  LightModeOutlined as LightModeIcon,
  PlaylistPlay as PlaylistIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useThemeContext } from '../context/ThemeContext';
import Logo from './Logo';
import { supabase } from '../lib/supabase';

const drawerWidth = 250;

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user } = useAuthStore();
  const { mode, toggleColorMode } = useThemeContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const open = Boolean(anchorEl);

  // Detectar rolagem para mudar o estilo da AppBar
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Sempre que o usuário logar, busca o avatar do Supabase e atualiza o estado local
  useEffect(() => {
    if (user && user.id) {
      (async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        if (profile?.avatar_url) {
          const { data } = supabase.storage.from('avatar').getPublicUrl(profile.avatar_url);
          setAvatarUrl(data?.publicUrl ? data.publicUrl + `?t=${Date.now()}` : undefined);
        } else {
          setAvatarUrl(undefined);
        }
      })();
    } else {
      setAvatarUrl(undefined);
    }
  }, [user]);

  // Fetch notifications for the logged-in user
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      setNotificationsLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error) setNotifications(data || []);
      setNotificationsLoading(false);
    };
    fetchNotifications();
    // Realtime: escuta mudanças nas notificações do usuário
    const channel = supabase
      .channel('nav:notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchNotifications)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    // Toggle menu if already open
    if (anchorEl && anchorEl === event.currentTarget) {
      setAnchorEl(null);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };
  const handleNotificationClose = () => {
    setAnchorEl(null);
  };
  const handleMarkNotificationRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const menuItems = [
    { text: 'Início', icon: <HomeIcon />, path: '/' },
    { text: 'Explorar', icon: <SearchIcon />, path: '/explore' },
    ...(user ? [
      { text: 'Biblioteca', icon: <LibraryMusicIcon />, path: '/library' },
      { text: 'Playlists', icon: <PlaylistIcon />, path: '/playlists' },
      { text: 'Upload', icon: <CloudUploadIcon />, path: '/upload' },
    ] : []),
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 4,
        }}
      >
        <Logo size="medium" withAnimation={true} />
      </Box>
      <List>
        {menuItems.map((item, index) => (
          <motion.div
            key={item.text}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                if (isMobile) handleDrawerToggle();
              }}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: '10px',
                mx: 1,
                mb: 1,
                transition: 'all 0.3s ease',
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                  color: 'primary.main',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main',
                  },
                },
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  transform: 'translateX(5px)',
                },
              }}
            >
              <ListItemIcon 
                sx={{ 
                  minWidth: 40,
                  color: location.pathname === item.path ? 'primary.main' : 'gray.500',
                  transition: 'color 0.3s ease'
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography 
                    sx={{
                      fontWeight: location.pathname === item.path ? 600 : 500,
                      fontSize: "0.95rem"
                    }}
                  >
                    {item.text}
                  </Typography>
                } 
              />
            </ListItemButton>
          </motion.div>
        ))}
      </List>
      {user && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 3,
            p: 2,
            mx: 2,
            mt: 4,
            mb: 2,
          }}
        >
          <Avatar
            src={avatarUrl}
            alt={user.user_metadata?.name || user.email || 'User'}
            sx={{ width: 48, height: 48, mr: 2, bgcolor: 'background.paper', color: 'primary.main', fontWeight: 700 }}
          />
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: '1rem', lineHeight: 1.2 }} noWrap>
              {user.email}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={scrolled ? 2 : 0}
        component={motion.div}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: scrolled ? 'background.paper' : 'transparent',
          color: 'text.primary',
          backdropFilter: scrolled ? 'blur(10px)' : 'none',
          transition: 'all 0.3s ease',
          borderBottom: scrolled ? '1px solid' : 'none',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'rotate(180deg)',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
          >
            <Logo size="small" withAnimation={false} />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Notificações">
              <span>
                <IconButton 
                  color="inherit"
                  component={motion.button}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={notifications.length > 0 ? handleNotificationClick : undefined}
                  disabled={notifications.length === 0}
                  aria-label="Notificações"
                >
                  <Badge badgeContent={unreadCount > 0 ? unreadCount : undefined} color="secondary">
                    <NotificationIcon />
                  </Badge>
                </IconButton>
              </span>
            </Tooltip>
            {notifications.length > 0 && (
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleNotificationClose}
                PaperProps={{
                  sx: { minWidth: 320, maxHeight: 400 }
                }}
              >
                <Typography sx={{ px: 2, pt: 1, fontWeight: 600 }}>Notificações</Typography>
                {notificationsLoading ? (
                  <MenuItem disabled>Carregando...</MenuItem>
                ) : notifications.slice(0, 10).map((n) => (
                  <MenuItem
                    key={n.id}
                    onClick={async () => {
                      await handleMarkNotificationRead(n.id);
                      handleNotificationClose();
                      if (n.sheet_id) navigate(`/sheet/${n.sheet_id}`);
                    }}
                    sx={{
                      fontWeight: n.read ? 400 : 700,
                      bgcolor: !n.read ? 'rgba(25, 118, 210, 0.08)' : undefined,
                      whiteSpace: 'normal',
                      alignItems: 'flex-start',
                      py: 1.2
                    }}
                  >
                    {n.type === 'download' && (
                      <span>O seu documento foi descarregado.</span>
                    )}
                    {n.type === 'rating' && (
                      <span>O documento que publicou foi avaliado.</span>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {new Date(n.created_at).toLocaleString('pt-PT')}
                    </Typography>
                  </MenuItem>
                ))}
              </Menu>
            )}
            
            <Tooltip title="Alternar tema">
              <IconButton 
                color="inherit"
                component={motion.button}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleColorMode}
              >
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            {user ? (
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Avatar
                  src={avatarUrl}
                  alt={user.user_metadata?.name || user.email || 'User'}
                  sx={{ 
                    cursor: 'pointer',
                    width: 38,
                    height: 38,
                    border: '2px solid',
                    borderColor: 'primary.main'
                  }}
                  onClick={() => navigate('/profile')}
                />
              </motion.div>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/auth')}
                component={motion.button}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                sx={{
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                }}
              >
                Entrar
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
              pt: { xs: 7, sm: 8 },
              boxShadow: isMobile ? '0 4px 20px rgba(0,0,0,0.1)' : 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Toolbar />
    </>
  );
}