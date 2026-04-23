@echo off
color 0A
echo ========================================================
echo       KHOI DONG HE THONG (GOP CHUNG WEB VA API)
echo ========================================================
echo.

echo [*] Dang don dep cac tien trinh ngrok bi ket...
taskkill /f /im ngrok.exe >nul 2>&1

echo [1] Dang dong goi giao dien Web (Build Frontend)...
echo     Buoc nay mat vai giay, vao luc demo the hien he thong dang compile.
cd frontend
call npm run build
cd ..

echo [2] Dang khoi dong Server Trung Tam (Port 8000)...
cd backend
start "MAIN SERVER" cmd /k "node server.js"
cd ..

echo [3] Dang tao duong ham Internet qua Ngrok...
start "NGROK PUBLIC TUNNEL" cmd /k "ngrok http 8000"

echo.
echo ========================================================
echo THANH CONG! He thong hoan chinh da san sang!
echo.
echo [!] test ngay tai dia chi duoi day:
echo     https://clutter-ravage-foothold.ngrok-free.dev/
echo ========================================================
pause