export APP_NAME="Gitinspect"

# Start fresh
rm -fr ./release
mkdir release

# Copy the Atom Shell base
cp -r build/Atom.app release

# Copy our application
cp -r app release/Atom.app/Contents/Resources

# Copy our icon
cp "assets/$APP_NAME.icns" "release/Atom.app/Contents/Resources"

# Rename things from "Atom" to our application's name
mv release/Atom.app "release/$APP_NAME.app"
mv "release/$APP_NAME.app/Contents/MacOS/Atom" "release/$APP_NAME.app/Contents/MacOS/$APP_NAME"
perl -pi -e "s,>Atom<,>$APP_NAME<,gi" "release/$APP_NAME.app/Contents/Info.plist"
perl -pi -e "s,>atom.icns<,>$APP_NAME.icns<,gi" "release/$APP_NAME.app/Contents/Info.plist"

# Refresh the icon cache
touch "release/$APP_NAME.app"