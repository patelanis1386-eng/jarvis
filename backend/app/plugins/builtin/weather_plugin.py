from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx

from app.plugins.base import BasePlugin


class WeatherPlugin(BasePlugin):
    name = "weather"
    description = "Weather information - current conditions, forecasts, and alerts"
    version = "1.0.0"
    author = "JARVIS X"
    config_schema = {
        "type": "object",
        "properties": {
            "api_key": {"type": "string", "description": "OpenWeatherMap API key"},
            "units": {"type": "string", "enum": ["metric", "imperial"], "default": "metric"},
        },
        "required": ["api_key"],
    }
    actions = {
        "get_current_weather": {"description": "Get current weather", "params": {"location": ""}},
        "get_forecast": {"description": "Get weather forecast", "params": {"location": "", "days": 7}},
        "get_alerts": {"description": "Get weather alerts", "params": {"location": ""}},
    }

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self._client: Optional[httpx.AsyncClient] = None
        self.api_key = ""
        self.units = "metric"

    async def initialize(self) -> bool:
        self.api_key = self.config.get("api_key", "")
        self.units = self.config.get("units", "metric")
        self._client = httpx.AsyncClient()
        return await super().initialize()

    async def execute(self, action: str, params: Dict[str, Any]) -> Any:
        if not self._client:
            raise RuntimeError("Weather plugin not initialized")

        handlers = {
            "get_current_weather": self._get_current_weather,
            "get_forecast": self._get_forecast,
            "get_alerts": self._get_alerts,
        }

        handler = handlers.get(action)
        if not handler:
            raise ValueError(f"Unknown action: {action}")
        return await handler(**params)

    async def _get_coordinates(self, location: str) -> Dict[str, float]:
        try:
            response = await self._client.get(
                "http://api.openweathermap.org/geo/1.0/direct",
                params={"q": location, "limit": 1, "appid": self.api_key},
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()
            if not data:
                raise ValueError(f"Location not found: {location}")
            return {"lat": data[0]["lat"], "lon": data[0]["lon"], "name": data[0].get("name", location)}
        except httpx.HTTPError as e:
            raise RuntimeError(f"Geocoding failed: {str(e)}")

    async def _get_current_weather(self, location: str) -> Dict[str, Any]:
        coords = await self._get_coordinates(location)
        try:
            response = await self._client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={
                    "lat": coords["lat"],
                    "lon": coords["lon"],
                    "appid": self.api_key,
                    "units": self.units,
                },
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            temp_unit = "°C" if self.units == "metric" else "°F"
            speed_unit = "m/s" if self.units == "metric" else "mph"

            return {
                "location": coords["name"],
                "temperature": f"{data['main']['temp']}{temp_unit}",
                "feels_like": f"{data['main']['feels_like']}{temp_unit}",
                "humidity": f"{data['main']['humidity']}%",
                "pressure": f"{data['main']['pressure']} hPa",
                "description": data["weather"][0]["description"].capitalize(),
                "icon": data["weather"][0]["icon"],
                "wind_speed": f"{data['wind']['speed']} {speed_unit}",
                "wind_direction": f"{data['wind']['deg']}°",
                "clouds": f"{data['clouds']['all']}%",
                "visibility": f"{data.get('visibility', 0)}m",
                "sunrise": datetime.fromtimestamp(data["sys"]["sunrise"], tz=timezone.utc).isoformat(),
                "sunset": datetime.fromtimestamp(data["sys"]["sunset"], tz=timezone.utc).isoformat(),
                "updated_at": datetime.fromtimestamp(data["dt"], tz=timezone.utc).isoformat(),
            }
        except httpx.HTTPError as e:
            raise RuntimeError(f"Weather fetch failed: {str(e)}")

    async def _get_forecast(self, location: str, days: int = 7) -> Dict[str, Any]:
        coords = await self._get_coordinates(location)
        try:
            response = await self._client.get(
                "https://api.openweathermap.org/data/2.5/forecast",
                params={
                    "lat": coords["lat"],
                    "lon": coords["lon"],
                    "appid": self.api_key,
                    "units": self.units,
                    "cnt": days * 8,
                },
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            temp_unit = "°C" if self.units == "metric" else "°F"
            daily_forecast = {}
            for item in data["list"]:
                date = item["dt_txt"].split()[0]
                if date not in daily_forecast:
                    daily_forecast[date] = {
                        "date": date,
                        "temps": [],
                        "descriptions": [],
                        "humidity": [],
                        "wind_speed": [],
                    }
                daily_forecast[date]["temps"].append(item["main"]["temp"])
                daily_forecast[date]["descriptions"].append(item["weather"][0]["description"])
                daily_forecast[date]["humidity"].append(item["main"]["humidity"])
                daily_forecast[date]["wind_speed"].append(item["wind"]["speed"])

            forecasts = []
            for date, fc in list(daily_forecast.items())[:days]:
                forecasts.append({
                    "date": date,
                    "temp_high": f"{max(fc['temps']):.1f}{temp_unit}",
                    "temp_low": f"{min(fc['temps']):.1f}{temp_unit}",
                    "description": max(set(fc["descriptions"]), key=fc["descriptions"].count),
                    "humidity": f"{sum(fc['humidity']) / len(fc['humidity']):.0f}%",
                    "wind": f"{sum(fc['wind_speed']) / len(fc['wind_speed']):.1f}",
                })

            return {
                "location": coords["name"],
                "forecasts": forecasts,
                "days": days,
            }
        except httpx.HTTPError as e:
            raise RuntimeError(f"Forecast fetch failed: {str(e)}")

    async def _get_alerts(self, location: str) -> Dict[str, Any]:
        coords = await self._get_coordinates(location)
        try:
            response = await self._client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={
                    "lat": coords["lat"],
                    "lon": coords["lon"],
                    "appid": self.api_key,
                },
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            alerts_data = data.get("alerts", [])
            alerts = [
                {
                    "event": alert.get("event", "Weather Alert"),
                    "start": datetime.fromtimestamp(alert["start"], tz=timezone.utc).isoformat() if "start" in alert else "",
                    "end": datetime.fromtimestamp(alert["end"], tz=timezone.utc).isoformat() if "end" in alert else "",
                    "description": alert.get("description", ""),
                    "tags": alert.get("tags", []),
                }
                for alert in alerts_data
            ]

            return {
                "location": coords["name"],
                "alerts": alerts,
                "alert_count": len(alerts),
            }
        except httpx.HTTPError as e:
            return {"location": coords["name"], "alerts": [], "alert_count": 0, "note": "Alerts not available for free tier"}

    async def cleanup(self) -> bool:
        if self._client:
            await self._client.aclose()
            self._client = None
        return await super().cleanup()
