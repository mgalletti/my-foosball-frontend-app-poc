import { useState } from 'react';
import { AppBar, Toolbar, Typography, Box, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

export default function MobileTemplate() {
  const [value, setValue] = useState(0);

  return (
    <Box sx={{ pb: 7 }}>
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            My App Title
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ p: 2, mt: 2 }}>
        <Typography variant="h5" align="center">
          Welcome to the app!
        </Typography>
      </Box>

      {/* Footer */}
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation
          showLabels
          value={value}
          onChange={(_, newValue) => setValue(newValue)}
        >
          <BottomNavigationAction label="Home" icon={<HomeIcon />} />
          <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
          <BottomNavigationAction label="Other" icon={<MoreHorizIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}