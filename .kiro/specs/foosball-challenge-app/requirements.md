# Requirements Document

## Introduction

The Foosball Challenge App is a mobile application that allows players to discover foosball locations, create challenges, and participate in games with other players. The app integrates map functionality to display available places, manages player profiles, and facilitates challenge creation and participation through a comprehensive mobile interface.

## Requirements

### Requirement 1

**User Story:** As a foosball player, I want to view available foosball places on a map, so that I can discover locations where I can play.

#### Acceptance Criteria

1. WHEN the app loads THEN the system SHALL display a map view showing all available places
2. WHEN a place is displayed on the map THEN the system SHALL show the place name, coordinates, and current status
3. WHEN a user taps on a place marker THEN the system SHALL display detailed information including place ID, name, and status
4. IF a place has status "1" THEN the system SHALL display it as available/active on the map
5. WHEN the map loads THEN the system SHALL fetch place data from the `/places` API endpoint

### Requirement 2

**User Story:** As a foosball player, I want to navigate through different sections of the app, so that I can access all available features easily.

#### Acceptance Criteria

1. WHEN the app loads THEN the system SHALL display a header with "Play foosball" as the app name
2. WHEN the app loads THEN the system SHALL display a footer with navigation links to Home, Places, Challenges, and Profile
3. WHEN a user taps on a footer navigation link THEN the system SHALL navigate to the corresponding section
4. WHEN navigating between sections THEN the system SHALL maintain the header and footer layout consistently

### Requirement 3

**User Story:** As a foosball player, I want to create challenges at available places, so that I can invite other players to compete.

#### Acceptance Criteria

1. WHEN a user selects an available place THEN the system SHALL provide an option to create a new challenge
2. WHEN creating a challenge THEN the system SHALL require a challenge name, date, time, and automatically set the creator as owner
3. WHEN a challenge is created THEN the system SHALL set the status to "Open" and include the place information
4. WHEN a challenge is created THEN the system SHALL assign a unique challenge ID
5. WHEN a challenge is saved THEN the system SHALL add the creator to the players list automatically

### Requirement 4

**User Story:** As a foosball player, I want to view and join existing challenges, so that I can participate in games with other players.

#### Acceptance Criteria

1. WHEN viewing challenges THEN the system SHALL display all challenges with status "Open"
2. WHEN displaying a challenge THEN the system SHALL show challenge name, place, date, time, owner, and current players
3. WHEN a user selects a challenge THEN the system SHALL provide an option to join if not already a participant
4. WHEN a user joins a challenge THEN the system SHALL add them to the players list
5. WHEN displaying challenges THEN the system SHALL fetch data from the `/challenges` API endpoint

### Requirement 5

**User Story:** As a foosball player, I want to manage my profile, so that other players can see my information and expertise level.

#### Acceptance Criteria

1. WHEN accessing the Profile section THEN the system SHALL display the current player's information
2. WHEN displaying player profile THEN the system SHALL show player ID, name, expertise level, and points
3. WHEN a player participates in challenges THEN the system SHALL track their expertise as "Novice", "Intermediate", or "Expert"
4. WHEN a player completes challenges THEN the system SHALL update their points accordingly
5. WHEN viewing other players THEN the system SHALL display their name, expertise, and points

### Requirement 6

**User Story:** As a foosball player, I want to explore places through a dedicated Places section, so that I can browse all available locations systematically.

#### Acceptance Criteria

1. WHEN accessing the Places section THEN the system SHALL display a list of all available places
2. WHEN displaying places THEN the system SHALL show place name, coordinates, and current status
3. WHEN a place is selected from the list THEN the system SHALL show detailed place information
4. WHEN viewing place details THEN the system SHALL display any active challenges at that location
5. WHEN a place has active challenges THEN the system SHALL indicate the number of open challenges

### Requirement 7

**User Story:** As a foosball player, I want the app to work seamlessly on mobile devices, so that I can use it conveniently while on the go.

#### Acceptance Criteria

1. WHEN the app loads on mobile THEN the system SHALL display a responsive layout optimized for mobile screens
2. WHEN interacting with the map THEN the system SHALL support touch gestures for zooming and panning
3. WHEN using navigation THEN the system SHALL provide touch-friendly buttons and links
4. WHEN displaying content THEN the system SHALL ensure text and buttons are appropriately sized for mobile interaction
5. WHEN the device orientation changes THEN the system SHALL adapt the layout accordingly