@echo off
echo Building and deploying to Vercel...
npm run build
echo Build complete. Upload the .next folder to Vercel manually or wait 8 hours for deployment limit to reset.
echo.
echo Alternative: Your site should still work with the current deployment.
echo The environment variables are already set in Vercel.
echo.
echo To manually deploy:
echo 1. Go to Vercel Dashboard
echo 2. Drag and drop the .next folder
echo 3. Or upgrade to Pro plan for unlimited deployments
pause