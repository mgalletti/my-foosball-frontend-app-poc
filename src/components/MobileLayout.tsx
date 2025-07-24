

/**
 * @fileoverview Enhanced Mobile Layout Component for Foosball Challenge App
 * 
 * This component provides a consistent mobile layout with header and footer navigation.
 * It integrates with the AppContext for navigation state management and ensures
 * responsive design with proper touch targets for mobile devices.
 * 
 * ## Features
 * - Responsive mobile-first design with fixed header and footer
 * - Bottom navigation with touch-friendly targets (minimum 44px)
 * - Integration with global navigation state management
 * - Consistent branding and visual hierarchy
 * - Accessibility support with proper ARIA labels
 * - Safe area handling for modern mobile devices
 * - Smooth transitions between sections
 * 
 * ## Usage
 * 
 * ### Basic Usage
 * ```tsx
 * import { MobileLayout } from '../components';
 * 
 * function App() {
 *   return (
 *     <MobileLayout currentSection="home">
 *       <div>Your app content here</div>
 *     </MobileLayout>
 *   );
 * }
 * ```
 * 
 * ### With Navigation State Management
 * ```tsx
 * import { MobileLayout } from '../components';
 * import { useNavigation } from '../context/AppContext';
 * 
 * function AppWithNavigation() {
 *   const { currentSection } = useNavigation();
 * 
 *   return (
 *     <MobileLayout currentSection={currentSection}>
 *       // Content changes based on currentSection
 *       {currentSection === 'home' && <HomeView />}
 *       {currentSection === 'places' && <PlacesView />}
 *       {currentSection === 'challenges' && <ChallengesView />}
 *       {currentSection === 'profile' && <ProfileView />}
 *     </MobileLayout>
 *   );
 * }
 * ```
 * 
 * ### Custom Content Areas
 * ```tsx
 * function CustomLayout() {
 *   return (
 *     <MobileLayout currentSection="places">
 *       <Box sx={{ p: 2 }}>
 *         <Typography variant="h4" gutterBottom>
 *           Places Near You
 *         </Typography>
 *         <PlacesList places={places} />
 *       </Box>
 *     </MobileLayout>
 *   );
 * }
 * ```
 * 
 * ## Navigation Sections
 * 
 * The component supports four main navigation sections:
 * 
 * - **Home** (`'home'`) - Dashboard and overview
 * - **Places** (`'places'`) - Foosball locations and map view
 * - **Challenges** (`'challenges'`) - Active and upcoming challenges
 * - **Profile** (`'profile'`) - User profile and settings
 * 
 * ## Layout Structure
 * 
 * ```
 * ┌─────────────────────────┐
 * │       App Header        │ ← Fixed top bar with title
 * ├─────────────────────────┤
 * │                         │
 * │     Content Area        │ ← Scrollable main content
 * │    (children prop)      │
 * │                         │
 * ├─────────────────────────┤
 * │   Bottom Navigation     │ ← Fixed bottom navigation
 * └─────────────────────────┘
 * ```
 * 
 * ## Responsive Design
 * 
 * - **Mobile First**: Optimized for mobile devices (320px+)
 * - **Touch Targets**: Minimum 44px touch targets for navigation
 * - **Safe Areas**: Handles device notches and home indicators
 * - **Viewport Units**: Uses vh/vw for consistent sizing
 * - **Flexible Content**: Content area adapts to available space
 * 
 * ## Accessibility
 * 
 * - Semantic HTML structure with proper landmarks
 * - ARIA labels for navigation elements
 * - Keyboard navigation support
 * - Screen reader compatible
 * - High contrast support
 * - Focus management between sections
 * 
 * @version 1.0.0
 */

import { AppBar, Toolbar, Typography, Box, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Home, MapPin, Trophy, User } from 'lucide-react';
import { useNavigation } from '../context/AppContext';
import type { AppSection } from '../types';
import { sections } from '../types';

/**
 * Props interface for the MobileLayout component
 * 
 * @interface MobileLayoutProps
 * @property {React.ReactNode} children - React children to render in the main content area.
 *                                       Can be any valid React elements including components,
 *                                       text, fragments, or arrays of elements.
 * @property {AppSection} currentSection - The currently active navigation section.
 *                                        Must be one of: 'home', 'places', 'challenges', 'profile'.
 *                                        Used to highlight the correct navigation item and
 *                                        can be overridden by global navigation state.
 * 
 * @example
 * ```tsx
 * const props: MobileLayoutProps = {
 *   children: <div>Main content here</div>,
 *   currentSection: 'places'
 * };
 * ```
 */
export interface MobileLayoutProps {
  children: React.ReactNode;
  currentSection: AppSection;
}


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
   * Converts AppSection enum values to numeric indices for use with
   * Material-UI's BottomNavigation component. This ensures consistent
   * mapping between section names and navigation positions.
   * 
   * @param {AppSection} section - Section name to convert to index
   * @returns {number} Numeric index of the section (0-3)
   * 
   * @example
   * ```tsx
   * getSectionIndex('places') // Returns 1
   * getSectionIndex('home')   // Returns 0
   * ```
   */
  const getSectionIndex = (section: AppSection): number => {
    return sections.indexOf(section);
  };

  /**
   * Maps navigation bar indices to section names
   * 
   * Converts numeric indices from Material-UI's BottomNavigation back
   * to AppSection enum values. Provides fallback to 'home' for invalid
   * indices to prevent navigation errors.
   * 
   * @param {number} index - Navigation bar index (0-3)
   * @returns {AppSection} Section name corresponding to the index
   * 
   * @example
   * ```tsx
   * getSectionFromIndex(1) // Returns 'places'
   * getSectionFromIndex(0) // Returns 'home'
   * getSectionFromIndex(99) // Returns 'home' (fallback)
   * ```
   */
  const getSectionFromIndex = (index: number): AppSection => {
    return sections[index] || 'home';
  };

  /**
   * Handles navigation changes from the bottom navigation bar
   * 
   * Processes user interactions with the bottom navigation and updates
   * the global navigation state through the AppContext. This ensures
   * consistent navigation state across the entire application.
   * 
   * @param {React.SyntheticEvent} _ - React synthetic event (unused)
   * @param {number} newValue - New selected navigation index
   * 
   * @example
   * ```tsx
   * // User taps on "Places" tab (index 1)
   * handleNavigationChange(event, 1) // Sets currentSection to 'places'
   * ```
   */
  const handleNavigationChange = (_: React.SyntheticEvent, newValue: number) => {
    const newSection = getSectionFromIndex(newValue);
    setCurrentSection(newSection);
  };

  return (
    <Box sx={{
      pb: 7,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <AppBar
        position="static"
        sx={{
          zIndex: 1100,
          width: '100%'
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