### Authentication & User Management

- **Users can sign up for an account or sign in**.
- **Guest users can try the chat but are limited to 5 messages**.
- **Authenticated users have unlimited access**.
- **Users can sign out via the sidebar**.

### Chat Interface

#### Welcome Screen

- **New users see a welcome screen with travel-related prompts**.
- Sample prompts include "Plan a trip to Paris", "Budget travel tips", etc.
- Clicking a prompt starts a new chat session.

#### Chat Messages

- Messages alternate between user (blue bubbles) and AI assistant (white bubbles).
- Support for Markdown formatting in responses.
- Messages automatically scroll to the latest content.
- Dynamic suggestions appear based on conversation context.

#### Input Options

- Text input for typing messages.
- Voice recording capability for spoken messages.
- Messages can be sent via the Enter key or Send button.

### Navigation & Session Management

#### Sidebar Navigation (Left Side)

- Can be collapsed/expanded.
- Shows chat history for authenticated users.
- Search functionality for finding past conversations.
- Quick actions: New Chat, Favorites, Notifications, Global.
- Session titles are automatically generated from the first message.

### Map Integration (Right Side)

- Shows locations mentioned in conversation.
- Real-time updates as new locations are discussed.
- Markers appear on the map for referenced places.
- Map panel can be hidden/shown.

### Special Features

#### Voice Input

- Users can record voice messages.
- Shows recording duration.
- Automatically transcribes speech to text.

#### Dynamic Suggestions

- Context-aware suggestions based on conversation.
- Different suggestions for flights, hotels, or activities.
- Clickable suggestion buttons for quick responses.

### Mobile Support

- Responsive design for mobile devices.
- Collapsible menus for smaller screens.
- Touch-friendly interface.

### To Test the Application, Verify:

#### Authentication Flow

1. Create a new account.
2. Sign in with existing credentials.
3. Test guest user limitations.
4. Verify sign-out functionality.

#### Chat Functionality

1. Start new conversations from prompts.
2. Send text messages.
3. Record and send voice messages.
4. Verify Markdown rendering.
5. Check message history loading.
6. Test suggestion interactions.

#### Session Management

1. Create multiple chat sessions.
2. Search through chat history.
3. Verify session persistence.
4. Test automatic title generation.

#### Map Features

1. Verify location markers appear.
2. Test real-time updates.
3. Check map interaction.
4. Verify location accuracy.

#### Edge Cases

1. Network disconnection handling.
2. Long message behavior.
3. Voice recording permissions.
4. Session restoration after refresh.

#### Mobile Testing

1. Verify responsive layout.
2. Test touch interactions.
3. Check menu functionality.
4. Verify map usability on mobile.

### Common User Flows to Test

1. Guest user trying the service.
2. New user registration and first chat.
3. Returning user accessing chat history.
4. Planning a trip with voice input.
5. Searching through past conversations.
6. Using map features for location planning.

