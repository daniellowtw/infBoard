clean:
	cd public && rm `ls -la | grep -v total | grep -v '[dl]rwx' | grep -v .html | awk '{ print $$9  }'`
