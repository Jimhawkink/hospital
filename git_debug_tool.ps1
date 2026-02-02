# Git & Vercel Diagnostic Tool
# Run this script to see exactly why Git or Vercel might be failing.

$logFile = "git_debug_report.txt"
"--- GIT DEBUG REPORT (Started at $(Get-Date)) ---`n" | Out-File $logFile

function Log-Command {
    param($cmd, $args)
    "`n>>> Running: $cmd $args" | Out-File $logFile -Append
    & $cmd $args 2>&1 | Out-File $logFile -Append
}

# 1. Check Git Status
Log-Command "git" "status"

# 2. Check Remotes
Log-Command "git" "remote -v"

# 3. Check Branches
Log-Command "git" "branch -vv"

# 4. Check Connection & Push (Verbose)
"--- ATTEMPTING VERBOSE PUSH ---" | Out-File $logFile -Append
Log-Command "git" "push origin main --verbose --progress"

# 5. Check Log
Log-Command "git" "log -n 3 --oneline"

# 6. Check for Vercel
if (Test-Path "vercel.json") {
    "✅ vercel.json found." | Out-File $logFile -Append
} else {
    "❌ vercel.json NOT found in root." | Out-File $logFile -Append
}

"`n--- DEBUG COMPLETE ---" | Out-File $logFile -Append
Write-Host "Diagnostic complete! Please check the file: $logFile" -ForegroundColor Green
Write-Host "You can open it by typing: notepad $logFile"
