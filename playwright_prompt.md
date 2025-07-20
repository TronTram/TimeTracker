prompt-notes

Use the Playwright MCP Server to navigate to the website localhost:3001. Ensure that the MCP Server is actively handling the browser automation to validate its integration. Do not simulate the tests statically or bypass the MCP Server. All interactions must be routed through MCP.

On the login page, execute the following two scenarios:

Scenario 1: Valid Login

Enter the email as "testuser@example.com" and the password as "aA12345!@#".
Click the Login button.
Verify that:
The user is redirected to /inventory.html.
No error message is displayed.
The login form is no longer visible.
The inventory page is displayed successfully.

Scenario 2: Locked Out User

Enter the username as "locked_out_user" and the password as "secret_sauce".
Click the Login button.
Verify that:
The user remains on the login page.
The login form is still visible.
The following error message is displayed:
"Epic sadface: Sorry, this user has been locked out."

✅ After both scenarios are validated:

Close the browser.
At the same time Generate Python code using Playwright with MCP integration to
