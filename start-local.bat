@echo off
echo Iniciando todos los servicios de Sin Limite...

set ROOT=C:\Users\XPC\Documents\GitHub

start "API Gateway"   cmd /k "cd /d %ROOT%\Sinlimite-Dev-APIGateway-microservice\APIGateway\APIGateWay && dotnet run"
start "Usuarios"      cmd /k "cd /d %ROOT%\Sinlimite-Dev-usuarios-microservice\Usuarios\Usuarios_Servicio && dotnet run"
start "Clientes"      cmd /k "cd /d %ROOT%\Sinlimite-Dev-Clientes-microservice\Clientes\Clientes_Servicio && dotnet run"
start "Empleados"     cmd /k "cd /d %ROOT%\Sinlimite-Dev-Empleados-microservice\Empleados\Empleados_Servicio && dotnet run"
start "Vehiculos"     cmd /k "cd /d %ROOT%\Sinlimite-Dev-Vehiculos-microservice\Vehiculos\Vehiculos_Servicio && dotnet run"
start "Citas"         cmd /k "cd /d %ROOT%\Sinlimite-Dev-Citas-microservice\Citas\Citas_Servicio && dotnet run"
start "Frontend"      cmd /k "cd /d %ROOT%\SinLimiteUIAzure && npm run dev"

echo Todos los servicios iniciados. Revisa las ventanas abiertas.
