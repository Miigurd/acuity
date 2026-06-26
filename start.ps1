Write-Host "Starting Acuity Services..." -ForegroundColor Green

Write-Host "Starting Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd acuity-backend; if (Test-Path .venv\Scripts\activate.ps1) { .\.venv\Scripts\activate.ps1 } else { .\.venv\Scripts\activate }; python -m webapp.app"

Write-Host "Starting User Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd acuity-frontend; npm start"

Write-Host "Starting Admin Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd acuity-admin; npm run dev"

Write-Host "All services started in new windows!" -ForegroundColor Green
