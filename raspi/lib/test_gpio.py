"""
Простой тест чтения состояния GPIO на Raspberry Pi.

В бесконечном цикле опрашивает пины 17 и 27 (BCM), выводит их состояние
каждые 0.5 с. Остановка по Ctrl+C с вызовом GPIO.cleanup().
"""

import RPi.GPIO as GPIO
import time

pins = [17, 27]

GPIO.setmode(GPIO.BCM)
for pin in pins:
    GPIO.setup(pin, GPIO.IN)

try:
    while True:
        states = [GPIO.input(pin) for pin in pins]
        print(" | ".join(f"GPIO{pin}={state}" for pin, state in zip(pins, states)))
        time.sleep(0.5)
except KeyboardInterrupt:
    GPIO.cleanup()
