/**
 * @fileoverview Enhanced Mobile Layout Component for Foosball Challenge App
 * 
 * This component provides a consistent mobile layout with header and footer navigation.
 * It integrates with the AppContext for navigation state management and ensures
 * responsive design with proper touch targets for mobile devices.
 * 
 * @version 1.0.0
 */

import { AppBar, Toolbar, Typography, Box, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Home, MapPin, Trophy, User } from 'lucide-react';
import { useNavigation } from '../context/AppContext';
import type { MobileLayoutProps, AppSection } from '../types';
import { sections } from '../types';

/**
 * Enhanced Mobile Layout Component
 * 
 * Provides a consistent mobile layout with header and footer navigation.
 * Integrates with the AppContext for navigation state management.
 * 
 * @param children - React children to render in the content area
 * @param currentSection - Current active section
 * @returns JSX element with mobile layout structure
 */
export default function MobileLayout({
  children,
  currentSection
}: MobileLayoutProps) {
  // Use the navigation hook from AppContext
  const { currentSection: contextCurrentSection, setCurrentSection } = useNavigation();

  // Use the context current section if available, otherwise fall back to prop
  const activeSection = contextCurrentSection || currentSection;

  /**
   * Maps section names to their index in the navigation bar
   * 
   * @param section - Section name to convert to index
   * @returns Numeric index of the section
   */
  const getSectionIndex = (section: AppSection): number => {
    return sections.indexOf(section);
  };

  /**
   * Maps navigation bar indices to section names
   * 
   * @param index - Navigation bar index
   * @returns Section name corresponding to the index
   */
  const getSectionFromIndex = (index: number): AppSection => {
    return sections[index] || 'home';
  };

  /**
   * Handles navigation changes from the bottom navigation bar
   * 
   * @param _ - React synthetic event (unused)
   * @param newValue - New selected index
   */
  const handleNavigationChange = (_: React.SyntheticEvent, newValue: number) => {
    const newSection = getSectionFromIndex(newValue);
    setCurrentSection(newSection);
  };

  return (
    <Box sx={{
      pb: 7,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <AppBar
        position="static"
        sx={{
          zIndex: 1100,
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)'
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontSize: { xs: '1.1rem', sm: '1.25rem' }
            }}
          >
            Play foosball
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        position: 'relative'
      }}>
        {children}
      </Box>

      {/* Bottom Navigation */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100
        }}
        elevation={3}
      >
        <BottomNavigation
          showLabels
          value={getSectionIndex(activeSection)}
          onChange={handleNavigationChange}
          sx={{
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              padding: '6px 12px 8px',
              '&.Mui-selected': {
                color: '#d58400',
              },
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem',
              '&.Mui-selected': {
                fontSize: '0.75rem',
                color: '#d58400',
              },
            },
          }}
        >
          <BottomNavigationAction
            label="Home"
            icon={<Home size={24} />}
            sx={{
              minHeight: 64,
              '& svg': {
                fontSize: '1.5rem'
              }
            }}
          />
          <BottomNavigationAction
            label="Places"
            icon={<MapPin size={24} />}
            sx={{
              minHeight: 64,
              '& svg': {
                fontSize: '1.5rem'
              }
            }}
          />
          <BottomNavigationAction
            label="Challenges"
            icon={<Trophy size={24} />}
            sx={{
              minHeight: 64,
              '& svg': {
                fontSize: '1.5rem'
              }
            }}
          />
          <BottomNavigationAction
            label="Profile"
            icon={<User size={24} />}
            sx={{
              minHeight: 64,
              '& svg': {
                fontSize: '1.5rem'
              }
            }}
          />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}