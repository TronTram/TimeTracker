Use the Playwright MCP Server to navigate to the website localhost:3001. Ensure that the MCP Server is actively handling the browser automation to validate its integration. Do not simulate the tests statically or bypass the MCP Server. All interactions must be routed through MCP.

On the login page, execute the following two scenarios:

Scenario 1: Valid SignIn
Enter the email as "test@example.com" and the password as "aA12345!@#".
Click the Login button.
Verify that:
The user is redirect to /dashboard