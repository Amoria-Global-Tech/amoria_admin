# Zoho WorkDrive Checker using curl.exe

Write-Host "=== Zoho WorkDrive Data Checker ===" -ForegroundColor Green

# Get access token
Write-Host "`nGetting access token..." -ForegroundColor Yellow
$tokenBody = @{
    grant_type = "refresh_token"
    client_id = "1000.Y7MVHTCMP44WMUIF543ZXXB474GFQF"
    client_secret = "4c34abfedaddd141c10573d327838f5ce83192bfe1"
    refresh_token = "1000.9a2046087445cf19c1d03ed9a0059a90.2e4a33f8f8a67112232396bc12efa66a"
}

$tokenResponse = Invoke-RestMethod -Uri "https://accounts.zoho.com/oauth/v2/token" -Method Post -Body $tokenBody
$token = $tokenResponse.access_token
Write-Host "Access token obtained!" -ForegroundColor Green
Write-Host "Scopes: $($tokenResponse.scope)" -ForegroundColor Cyan
Write-Host "Token: $token" -ForegroundColor Gray

# Check user info
Write-Host "`n1. USER INFORMATION:" -ForegroundColor Yellow
$userJson = curl.exe -s -X GET "https://workdrive.zoho.com/api/v1/users/me" -H "Authorization: Zoho-oauthtoken $token"
$user = $userJson | ConvertFrom-Json
Write-Host "Email: $($user.data.attributes.email_id)" -ForegroundColor White
Write-Host "Name: $($user.data.attributes.display_name)" -ForegroundColor White
Write-Host "Org ID: $($user.data.attributes.org_id)" -ForegroundColor White

# List files
Write-Host "`n2. FILES AND FOLDERS:" -ForegroundColor Yellow
$filesJson = curl.exe -s -X GET "https://workdrive.zoho.com/api/v1/files" -H "Authorization: Zoho-oauthtoken $token"
$files = $filesJson | ConvertFrom-Json

if ($files.data.Count -eq 0) {
    Write-Host "No files found in root directory" -ForegroundColor Red
    Write-Host "Trying to get team folders..." -ForegroundColor Yellow
    
    # Try team folders
    $teamFoldersJson = curl.exe -s -X GET "https://workdrive.zoho.com/api/v1/users/me/teamfolders" -H "Authorization: Zoho-oauthtoken $token"
    Write-Host "`nTeam Folders Response:" -ForegroundColor Cyan
    Write-Host $teamFoldersJson
} else {
    Write-Host "Found $($files.data.Count) items:" -ForegroundColor Green
    foreach ($item in $files.data) {
        $type = if ($item.attributes.type -eq 'folder') { '[FOLDER]' } else { '[FILE]  ' }
        Write-Host "$type $($item.attributes.name)" -ForegroundColor Cyan
        Write-Host "        ID: $($item.id)" -ForegroundColor Gray
        Write-Host "        Type: $($item.type)" -ForegroundColor Gray
        Write-Host ""
    }
}

# Try to get teams
Write-Host "`n3. TEAMS:" -ForegroundColor Yellow
$teamsJson = curl.exe -s -X GET "https://workdrive.zoho.com/api/v1/teams" -H "Authorization: Zoho-oauthtoken $token"
Write-Host $teamsJson

# Try private space
Write-Host "`n4. PRIVATE SPACE:" -ForegroundColor Yellow
$privateJson = curl.exe -s -X GET "https://workdrive.zoho.com/api/v1/users/me/privatespace" -H "Authorization: Zoho-oauthtoken $token"
Write-Host $privateJson

Write-Host "`n=== MANUAL METHOD TO GET FOLDER ID ===" -ForegroundColor Green
Write-Host "1. Login to https://workdrive.zoho.com" -ForegroundColor White
Write-Host "2. Navigate to your Products folder" -ForegroundColor White
Write-Host "3. The URL will contain the folder ID after '/folders/'" -ForegroundColor White
Write-Host "4. Example: .../folders/1n8cs2b5e8f7g4a2b1c3d4e5f6g7h8i9j0" -ForegroundColor White

Write-Host "`nScript completed!" -ForegroundColor Green