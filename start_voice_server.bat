@echo off
chcp 65001 >nul
title Najimez AI Voice Server (ElevenLabs AI Voice Engine)
echo ============================================================
echo   NAJIMEZ AI VOICE SERVER (ElevenLabs AI Voice Studio)
echo ============================================================
echo   Dang khoi dong server ElevenLabs AI thoi gian thuc...
echo   Dia chi: http://127.0.0.1:5050
echo   Dong co: ElevenLabs Multilingual v2 ^& Flash v2.5
echo   Bo nho dem tiet kiem 100%% quota: .cache_tts
echo   (Nhan Ctrl+C de dung server)
echo ============================================================
python tts_server.py
pause
