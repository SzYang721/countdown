#!/bin/bash

# Deploy script for GitHub Pages
echo "Building the project..."
npm run build

echo "Copying files to docs directory for GitHub Pages..."
rm -rf docs
mkdir docs
cp -r out/* docs/

echo "Adding and committing changes..."
git add docs/
git commit -m "Deploy to GitHub Pages" || echo "No changes to commit"
git push origin main

echo "Deployment complete! The site should be available at https://songzeyang.github.io/countdown/"
