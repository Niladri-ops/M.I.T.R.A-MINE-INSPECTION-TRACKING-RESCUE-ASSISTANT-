Write-Host "Installing frontend dependencies..."
npm install
Write-Host "Installing backend dependencies..."
Set-Location server
npm install
Set-Location ..
Write-Host "Done. Run 'npm run dev' for frontend and 'cd server; npm run dev' for backend."
