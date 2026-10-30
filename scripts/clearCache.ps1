# Clear Next.js Cache Script
# Fixes "Loading chunk failed" errors by clearing all build artifacts

Write-Host "🧹 Clearing Next.js Cache..." -ForegroundColor Cyan
Write-Host ""

# Clear .next build directory
if (Test-Path .next) {
    try {
        Remove-Item -Recurse -Force .next -ErrorAction Stop
        Write-Host "✅ Cleared .next build directory" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to clear .next: $_" -ForegroundColor Red
    }
} else {
    Write-Host "ℹ️  .next not found (already clean)" -ForegroundColor Yellow
}

# Clear Next.js cache in node_modules
if (Test-Path "node_modules/.cache/next") {
    try {
        Remove-Item -Recurse -Force "node_modules/.cache/next" -ErrorAction Stop
        Write-Host "✅ Cleared node_modules Next.js cache" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to clear node_modules cache: $_" -ForegroundColor Red
    }
} else {
    Write-Host "ℹ️  node_modules cache not found" -ForegroundColor Yellow
}

# Clear webpack cache
if (Test-Path "node_modules/.cache/webpack") {
    try {
        Remove-Item -Recurse -Force "node_modules/.cache/webpack" -ErrorAction Stop
        Write-Host "✅ Cleared webpack cache" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to clear webpack cache: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✨ Cache clearing complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Run: pnpm dev" -ForegroundColor White
Write-Host "   2. Hard refresh browser: Ctrl+Shift+R (or Cmd+Shift+R on Mac)" -ForegroundColor White
Write-Host ""
