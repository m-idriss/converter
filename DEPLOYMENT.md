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

### Setting up FTP Secrets

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

### Manual FTP Upload

If you need to deploy manually:

```bash
# Build the application
npm run build -- --configuration=production --base-href=/converter/

# Upload files to FTP server (example using lftp)
lftp -c "set ftp:ssl-allow no; open ftp://username:password@3dime.com; mirror -R dist/converter-app/browser/ /converter/"
```

## Troubleshooting

### Build Issues
- Ensure Node.js 20+ is available on your local environment
- Check that all dependencies install correctly with `npm ci`
- Verify the build works locally: `npm run build -- --configuration=production --base-href=/converter/`

### Deployment Issues
- Verify FTP connectivity and credentials: test with an FTP client like FileZilla
- Check that the target directory has proper write permissions
- Verify the FTP server path is correct (usually relative to FTP user's home directory)
- Check GitHub Actions logs for specific error messages

### Routing Issues
- Ensure the web server is configured to serve the Angular app correctly
- Verify that the base href is set to `/converter/` in the built index.html
- Check that the web server handles Angular's client-side routing

## Testing the Deployment

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