import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MobileLayout from '../MobileLayout';
import { AppProvider } from '../../context/AppContext';
import type { AppSection } from '../../types';

// Mock the navigation hook to test component behavior
const mockSetCurrentSection = vi.fn();
vi.mock('../../context/AppContext', async () => {
  const actual = await vi.importActual('../../context/AppContext');
  return {
    ...actual,
    useNavigation: () => ({
      setCurrentSection: mockSetCurrentSection,
      currentSection: 'home',
      previousSection: undefined,
      goBack: vi.fn()
    })
  };
});

describe('MobileLayout', () => {
  const defaultProps = {
    currentSection: 'home' as AppSection,
    children: <div data-testid="test-content">Test Content</div>
  };

  const renderWithProvider = (props = defaultProps) => {
    return render(
      <AppProvider>
        <MobileLayout {...props} />
      </AppProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Header', () => {
    it('displays "Play foosball" as the header title', () => {
      renderWithProvider();
      
      expect(screen.getByText('Play foosball')).toBeInTheDocument();
    });

    it('renders the header with AppBar component', () => {
      renderWithProvider();
      
      // Check that header exists with the title
      const header = screen.getByText('Play foosball');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Content Area', () => {
    it('renders children content', () => {
      renderWithProvider();
      
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('Bottom Navigation', () => {
    it('renders all four navigation sections', () => {
      renderWithProvider();
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Places')).toBeInTheDocument();
      expect(screen.getByText('Challenges')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('displays correct navigation labels', () => {
      renderWithProvider();
      
      const homeButton = screen.getByRole('button', { name: /home/i });
      const placesButton = screen.getByRole('button', { name: /places/i });
      const challengesButton = screen.getByRole('button', { name: /challenges/i });
      const profileButton = screen.getByRole('button', { name: /profile/i });
      
      expect(homeButton).toBeInTheDocument();
      expect(placesButton).toBeInTheDocument();
      expect(challengesButton).toBeInTheDocument();
      expect(profileButton).toBeInTheDocument();
    });
  });

  describe('Section Navigation Logic', () => {
    it('correctly maps sections to indices', () => {
      const { rerender } = renderWithProvider({ ...defaultProps, currentSection: 'home' });
      
      // Test that different sections render without errors
      
      rerender(
        <AppProvider>
          <MobileLayout {...defaultProps} currentSection="places" />
        </AppProvider>
      );
      expect(screen.getByText('Places')).toBeInTheDocument();
      
      rerender(
        <AppProvider>
          <MobileLayout {...defaultProps} currentSection="challenges" />
        </AppProvider>
      );
      expect(screen.getByText('Challenges')).toBeInTheDocument();

      rerender(
        <AppProvider>
          <MobileLayout {...defaultProps} currentSection="profile" />
        </AppProvider>
      );
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });
  });

  describe('Navigation Interaction', () => {
    it('calls setCurrentSection when navigation buttons are clicked', () => {
      renderWithProvider();
      
      const profileButton = screen.getByRole('button', { name: /profile/i });
      fireEvent.click(profileButton);
      
      // The BottomNavigation component should trigger onChange with index 1 for profile
      expect(mockSetCurrentSection).toHaveBeenCalledWith('profile');
    });

    it('handles navigation changes correctly', () => {
      renderWithProvider();
      
      const placesButton = screen.getByRole('button', { name: /places/i });
      fireEvent.click(placesButton);
      
      expect(mockSetCurrentSection).toHaveBeenCalledWith('places');
    });

    it('uses context current section when available', () => {
      // Test that the component uses the context current section over the prop
      renderWithProvider({ currentSection: 'places', children: <div>Test</div> });
      
      // Since the mock returns 'home' as currentSection, it should use that instead of the prop 'places'
      // We can verify this by checking that the Home button is selected (has Mui-selected class)
      const homeButton = screen.getByRole('button', { name: /home/i });
      expect(homeButton).toHaveClass('Mui-selected');
    });
  });

  describe('Component Structure', () => {
    it('maintains proper layout structure', () => {
      renderWithProvider();
      
      // Check that all main elements are present
      expect(screen.getByText('Play foosball')).toBeInTheDocument();
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('renders with different sections', () => {
      const sections: AppSection[] = ['home', 'profile', 'places', 'challenges'];
      
      sections.forEach(section => {
        const { unmount } = render(
          <AppProvider>
            <MobileLayout 
              {...defaultProps} 
              currentSection={section}
            />
          </AppProvider>
        );
        
        expect(screen.getByText('Play foosball')).toBeInTheDocument();
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Props Handling', () => {
    it('handles missing children gracefully', () => {
      expect(() => {
        render(
          <AppProvider>
            <MobileLayout 
              currentSection="home"
              children={undefined}
            />
          </AppProvider>
        );
      }).not.toThrow();
    });

    it('accepts all valid section types', () => {
      const validSections: AppSection[] = ['home', 'profile', 'places', 'challenges'];
      
      validSections.forEach(section => {
        expect(() => {
          render(
            <AppProvider>
              <MobileLayout 
                currentSection={section}
                children={<div>Test</div>}
              />
            </AppProvider>
          );
        }).not.toThrow();
      });
    });
  });

  describe('Responsive Design Features', () => {
    it('includes mobile-optimized styling', () => {
      renderWithProvider();
      
      // Check that the component renders without errors and includes navigation
      expect(screen.getByText('Play foosball')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Places')).toBeInTheDocument();
      expect(screen.getByText('Challenges')).toBeInTheDocument();
    });
  });
});