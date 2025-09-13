# Deployment Configuration

This document explains how to configure automatic deployment to `http://3dime.com/converter` when code is pushed to the master branch.

## GitHub Actions Workflow

The deployment is handled by the GitHub Actions workflow in `.github/workflows/deploy.yml`. This workflow:

1. Builds the Angular application with production configuration
2. Sets the base href to `/converter/` for proper routing on the subdomain
3. Deploys the built files to the target server

## Deployment Method

The workflow uses FTP deployment to upload files to the server. You need to configure the following GitHub repository secrets:

### FTP Deployment

Required secrets in your GitHub repository:
- `FTP_SERVER`: The FTP server hostname or IP address (e.g., `3dime.com` or `ftp.3dime.com`)
- `FTP_USERNAME`: FTP username for the server
- `FTP_PASSWORD`: FTP password for authentication
- `FTP_PATH`: Target directory path on the server (e.g., `/public_html/converter/` or `/converter/`)

### Firebase Environment Configuration

The deployment workflow requires a Firebase configuration for production. You need to set up one additional secret:

- `ENV_PROD_TS`: Complete TypeScript content for the production environment file

#### Setting up the ENV_PROD_TS Secret

The `ENV_PROD_TS` secret must contain properly formatted TypeScript code with **quoted string values**. Here's the correct format:

```typescript
export const environment = {
  production: true,
  firebase: {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id", 
    storageBucket: "your-project-id.firebasestorage.app",
    messagingSenderId: "your-messaging-sender-id",
    appId: "1:your-messaging-sender-id:web:your-app-id-here",
    measurementId: "G-your-measurement-id"
  }
};
```

**⚠️ Critical: All Firebase configuration values must be quoted as strings!**

### Setting up GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret" and add each of the required secrets above

## Server Configuration

The workflow deploys files to the `/converter/` directory on your FTP server. Make sure:
- The FTP user has write permissions to the target directory
- The web server is configured to serve files from the correct location
- The target directory path matches your web server document root structure

### Nginx Configuration Example

If using Nginx, add this location block to serve the converter app:

```nginx
server {
    server_name 3dime.com;
    root /var/www/html;  # or your document root
    
    location /converter/ {
        try_files $uri $uri/ /converter/index.html;
        
        # Handle Angular routing
        location ~ ^/converter/.*$ {
            try_files $uri /converter/index.html;
        }
    }
    
    # Your other server configuration...
}
```

### Apache Configuration Example

If using Apache, add this to your virtual host or `.htaccess` in the `/converter/` directory:

```apache
<Directory "/var/www/html/converter">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
    
    # Handle Angular routing
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^.*$ /converter/index.html [L]
</Directory>
```

## Alternative Deployment Methods

### SSH Deployment

If you prefer SSH deployment, you can modify the workflow to use SSH instead of FTP by adding these secrets:
- `SSH_HOST`: The server hostname or IP address
- `SSH_USERNAME`: SSH username for the server  
- `SSH_PRIVATE_KEY`: Private SSH key for authentication
- `SSH_PORT`: SSH port (optional, defaults to 22)

## Troubleshooting

### Build Issues
- Ensure Node.js 20+ is available on your local environment
- Check that all dependencies install correctly with `npm ci`
- Verify the build works locally: `npm run build -- --configuration=production --base-href=/converter/`

#### Firebase Configuration Errors

If you see TypeScript compilation errors like:
- `Cannot find name 'AIzaSyDvQ4aCcWtSxGmTXefINTcsdb0O5zheYzE'`
- `Cannot find name 'image'`
- `Types of property 'authDomain' are incompatible. Type 'number' is not assignable to type 'string'`

This means your `ENV_PROD_TS` secret contains unquoted Firebase configuration values. Update the secret to ensure all values are properly quoted as strings:

```typescript
// ❌ Wrong (causes build failures):
apiKey: AIzaSyDvQ4aCcWtSxGmTXefINTcsdb0O5zheYzE,
authDomain: your-project.firebaseapp.com,

// ✅ Correct (properly quoted):
apiKey: "AIzaSyDvQ4aCcWtSxGmTXefINTcsdb0O5zheYzE",
authDomain: "your-project.firebaseapp.com",
```

### Deployment Issues

#### DNS Resolution Errors (ENOTFOUND)
If you encounter "getaddrinfo ENOTFOUND" errors in GitHub Actions:

1. **Verify FTP server hostname**: Ensure the `FTP_SERVER` secret contains the correct hostname
2. **Use troubleshooting script**: Run `./scripts/troubleshoot-deployment.sh your-ftp-server.com` locally
3. **Check DNS configuration**: Verify the hostname resolves correctly with multiple DNS servers
4. **Test from different locations**: The hostname might be geographically restricted
5. **Consider using IP address**: Use the server's IP address instead of hostname if DNS is problematic
6. **Check server availability**: Ensure the FTP server is online and accessible

The deployment workflow now includes:
- Automatic DNS resolution validation with multiple DNS servers
- Retry mechanism with 30-second delay between attempts
- Comprehensive diagnostics if deployment fails
- Timeout and error handling for network issues

#### General FTP Issues
- Verify FTP connectivity and credentials: test with an FTP client like FileZilla
- Check that the target directory has proper write permissions
- Verify the FTP server path is correct (usually relative to FTP user's home directory)
- Check GitHub Actions logs for specific error messages
- Ensure GitHub Actions IP ranges are allowed on your server firewall

### Routing Issues
- Ensure the web server is configured to serve the Angular app correctly
- Verify that the base href is set to `/converter/` in the built index.html
- Check that the web server handles Angular's client-side routing

## Testing the Deployment

### Validating Environment Configuration

Before setting up deployment, you can test your Firebase environment configuration:

```bash
# Validate current environment file
./scripts/validate-environment.sh

# Validate specific environment file
./scripts/validate-environment.sh src/environments/environment.prod.ts

# Test what GitHub Actions would do with your ENV_PROD_TS content
./scripts/validate-environment.sh "" "$(cat your-prod-env-content.ts)"
```

The validation script will:
- Check TypeScript syntax
- Verify all required Firebase fields are present  
- Detect unquoted configuration values that cause deployment failures
- Simulate the GitHub Actions environment replacement process

### Deployment Testing

After a successful deployment:
1. Visit `http://3dime.com/converter`
2. Verify the application loads correctly
3. Test navigation and file upload functionality
4. Check browser console for any 404 errors on assets

## Manual Deployment

If you need to deploy manually:

```bash
# Build the application
npm run build -- --configuration=production --base-href=/converter/

# Upload files to FTP server (example using lftp)
lftp -c "set ftp:ssl-allow no; open ftp://username:password@3dime.com; mirror -R dist/converter-app/browser/ /converter/"
```