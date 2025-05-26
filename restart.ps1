# restart.ps1
docker-compose down
docker-compose build --no-cache
docker-compose up