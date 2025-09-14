#!/bin/bash

# Firebase Environment Validation Script
# This script helps validate that your Firebase environment configuration is correct

set -e

echo "🔥 Firebase Environment Configuration Validator"
echo "==============================================="
echo

# Function to check if a file contains valid TypeScript syntax
validate_typescript_syntax() {
    local file_path="$1"
    local temp_dir="/tmp/env_validation_$$"
    
    echo "📋 Validating TypeScript syntax for: $file_path"
    
    # Create a temporary TypeScript project for validation
    mkdir -p "$temp_dir"
    cd "$temp_dir"
    
    # Copy the environment file to validate
    cp "$file_path" "./environment.ts"
    
    # Create a minimal tsconfig.json
    cat > "./tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022", "dom"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node"
  },
  "include": ["*.ts"]
}
EOF
    
    # Try to compile the TypeScript file
    if command -v tsc >/dev/null 2>&1; then
        if tsc --noEmit environment.ts 2>/dev/null; then
            echo "✅ TypeScript syntax is valid"
            cleanup_temp_dir "$temp_dir"
            return 0
        else
            echo "❌ TypeScript syntax errors found:"
            tsc --noEmit environment.ts 2>&1 | sed 's/^/   /'
            cleanup_temp_dir "$temp_dir"
            return 1
        fi
    else
        echo "⚠️  TypeScript compiler (tsc) not found - skipping syntax validation"
        echo "   Install TypeScript globally: npm install -g typescript"
        cleanup_temp_dir "$temp_dir"
        return 0
    fi
}

# Function to clean up temporary directory
cleanup_temp_dir() {
    local temp_dir="$1"
    cd - > /dev/null
    rm -rf "$temp_dir"
}

# Function to validate Firebase configuration structure
validate_firebase_config() {
    local file_path="$1"
    
    echo "🔍 Checking Firebase configuration structure..."
    
    # Check for required Firebase fields
    local required_fields=("apiKey" "authDomain" "projectId" "storageBucket" "messagingSenderId" "appId")
    local missing_fields=()
    
    for field in "${required_fields[@]}"; do
        if ! grep -q "$field:" "$file_path"; then
            missing_fields+=("$field")
        fi
    done
    
    if [ ${#missing_fields[@]} -eq 0 ]; then
        echo "✅ All required Firebase fields are present"
    else
        echo "❌ Missing required Firebase fields:"
        for field in "${missing_fields[@]}"; do
            echo "   - $field"
        done
        return 1
    fi
    
    # Check for proper string quoting
    echo
    echo "🔍 Checking for proper string quoting..."
    
    local unquoted_patterns=()
    
    # Check for unquoted API key pattern
    if grep -q 'apiKey: [A-Za-z0-9_-]\+[^"]' "$file_path"; then
        unquoted_patterns+=("apiKey (appears to be unquoted)")
    fi
    
    # Check for unquoted domain patterns
    if grep -q 'authDomain: [a-zA-Z0-9.-]\+\.firebaseapp\.com[^"]' "$file_path"; then
        unquoted_patterns+=("authDomain (appears to be unquoted)")
    fi
    
    # Check for unquoted project ID
    if grep -q 'projectId: [a-zA-Z0-9-]\+[^"]' "$file_path"; then
        unquoted_patterns+=("projectId (appears to be unquoted)")
    fi
    
    if [ ${#unquoted_patterns[@]} -eq 0 ]; then
        echo "✅ Firebase configuration values appear to be properly quoted"
    else
        echo "⚠️  Potentially unquoted Firebase configuration values detected:"
        for pattern in "${unquoted_patterns[@]}"; do
            echo "   - $pattern"
        done
        echo
        echo "💡 Make sure all Firebase configuration values are wrapped in quotes:"
        echo "   apiKey: \"AIzaSy...\","
        echo "   authDomain: \"my-project.firebaseapp.com\","
        echo "   projectId: \"my-project\","
        echo "   ..."
        return 1
    fi
}

# Function to simulate the GitHub Actions environment replacement
test_github_actions_replacement() {
    local env_content="$1"
    local temp_file="/tmp/test_env_replacement_$$.ts"
    
    echo "🧪 Testing GitHub Actions environment replacement simulation..."
    
    # Simulate what GitHub Actions does: echo the content to a file
    echo "$env_content" > "$temp_file"
    
    echo "📄 Generated environment file content:"
    echo "   File: $temp_file"
    cat "$temp_file" | sed 's/^/   /'
    echo
    
    # Validate the generated file
    if validate_typescript_syntax "$temp_file"; then
        echo "✅ Simulated GitHub Actions replacement would work correctly"
        rm -f "$temp_file"
        return 0
    else
        echo "❌ Simulated GitHub Actions replacement would fail"
        echo "💡 This is what would be written to src/environments/environment.ts during deployment"
        rm -f "$temp_file"
        return 1
    fi
}

# Main validation function
main() {
    local env_file="${1:-src/environments/environment.ts}"
    local test_content="$2"
    
    echo "Input: Environment file = $env_file"
    if [ -n "$test_content" ]; then
        echo "       Test content provided via argument"
    fi
    echo
    
    # Test GitHub Actions content if provided
    if [ -n "$test_content" ]; then
        if ! test_github_actions_replacement "$test_content"; then
            echo
            echo "❌ Validation failed for provided test content"
            echo "   This content would cause deployment failures"
            return 1
        fi
        echo
    fi
    
    # Validate existing environment file
    if [ -f "$env_file" ]; then
        echo "📁 Validating existing environment file: $env_file"
        echo
        
        if validate_typescript_syntax "$env_file" && validate_firebase_config "$env_file"; then
            echo
            echo "🎉 Environment file validation passed!"
            echo "   Your environment configuration should work correctly"
            return 0
        else
            echo
            echo "❌ Environment file validation failed"
            echo "   Please fix the issues above before deployment"
            return 1
        fi
    else
        echo "📁 Environment file not found: $env_file"
        
        if [ -z "$test_content" ]; then
            echo "❌ No environment file found and no test content provided"
            echo
            echo "Usage:"
            echo "  $0 [environment-file-path]"
            echo "  $0 [environment-file-path] \"test-content\""
            echo
            echo "Examples:"
            echo "  $0"
            echo "  $0 src/environments/environment.ts"
            echo "  $0 src/environments/environment.ts \"\$(cat my-env-content.ts)\""
            return 1
        fi
    fi
}

# Help function
show_help() {
    echo "Firebase Environment Configuration Validator"
    echo "==========================================="
    echo
    echo "This script validates Firebase environment configuration files for TypeScript syntax"
    echo "and proper string quoting to prevent deployment failures."
    echo
    echo "Usage:"
    echo "  $0 [OPTIONS] [environment-file-path] [test-content]"
    echo
    echo "Arguments:"
    echo "  environment-file-path   Path to environment.ts file (default: src/environments/environment.ts)"
    echo "  test-content           Optional: Test content to validate (simulates GitHub Actions replacement)"
    echo
    echo "Options:"
    echo "  -h, --help             Show this help message"
    echo
    echo "Examples:"
    echo "  $0                                                    # Validate default environment file"
    echo "  $0 src/environments/environment.prod.ts               # Validate specific file"
    echo "  $0 \"\" \"export const environment = { ... }\"           # Test content only"
    echo
    echo "Common Issues Fixed:"
    echo "  • Unquoted Firebase configuration values"
    echo "  • Invalid TypeScript syntax"
    echo "  • Missing required Firebase fields"
    echo
    echo "This addresses the deployment error:"
    echo "  TS2304: Cannot find name 'AIzaSyDvQ4aCcWtSxGmTXefINTcsdb0O5zheYzE'"
}

# Handle command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac