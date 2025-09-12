# Deployment Configuration

This document explains how to configure automatic deployment to `http://3dime.com/converter` when code is pushed to the master branch.

## GitHub Actions Workflow

The deployment is handled by the GitHub Actions workflow in `.github/workflows/deploy.yml`. This workflow:

1. Builds the Angular application with production configuration
2. Sets the base href to `/converter/` for proper routing on the subdomain
3. Deploys the built files to the target server

## Deployment Methods

The workflow supports SSH/SCP deployment (recommended). To use it, you need to configure the following GitHub repository secrets:

### SSH Deployment (Recommended)

Required secrets in your GitHub repository:
- `SSH_HOST`: The server hostname or IP address (e.g., `3dime.com`)
- `SSH_USERNAME`: SSH username for the server
- `SSH_PRIVATE_KEY`: Private SSH key for authentication
- `SSH_PORT`: SSH port (optional, defaults to 22)

### Setting up SSH Secrets

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret" and add each of the required secrets above

### SSH Key Generation

If you don't have an SSH key pair, generate one:

```bash
ssh-keygen -t ed25519 -C "github-actions@converter-deploy"
```

- Copy the public key (`~/.ssh/id_ed25519.pub`) to your server's `~/.ssh/authorized_keys`
- Copy the private key (`~/.ssh/id_ed25519`) to the `SSH_PRIVATE_KEY` secret

## Server Configuration

The workflow assumes:
- The web server serves files from `/var/www/3dime.com/converter/`
- The web server user is `www-data` (typical for Apache/Nginx on Ubuntu)
- The deployment user has sudo privileges to modify files in `/var/www/`

### Nginx Configuration Example

If using Nginx, add this location block to serve the converter app:

```nginx
server {
    server_name 3dime.com;
    
    location /converter/ {
        alias /var/www/3dime.com/converter/;
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

If using Apache, add this to your virtual host or `.htaccess`:

```apache
<Directory "/var/www/3dime.com/converter">
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

### FTP Deployment

If you prefer FTP deployment, uncomment the FTP section in the workflow and add these secrets:
- `FTP_SERVER`: FTP server hostname
- `FTP_USERNAME`: FTP username
- `FTP_PASSWORD`: FTP password

## Troubleshooting

### Build Issues
- Ensure Node.js 20+ is available on your local environment
- Check that all dependencies install correctly with `npm ci`
- Verify the build works locally: `npm run build -- --configuration=production --base-href=/converter/`

### Deployment Issues
- Check that SSH connectivity works: `ssh user@3dime.com`
- Verify the target directory exists and has proper permissions
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

# Copy files to server (example using rsync)
rsync -avz --delete dist/converter-app/browser/ user@3dime.com:/var/www/3dime.com/converter/
```