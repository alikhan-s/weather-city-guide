const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

app.set('view engine', 'ejs');


const CITY_NEWS_MAPPING = {
  "Astana": "Астана",                    "Almaty": "Алматы",
  "Atyrau": "Атырау",                    "Aktau": "Актау",
  "Aktobe": "Актобе",                    "Zhezkazgan": "Жезказган",
  "Kapsagai": "Капшагай",                "Karaganda": "Караганда",
  "Kostanay": "Костанай",                "Kokshetau": "Кокшетау",
  "Kyzlorda": "Кызылорда",               "Pavlodar": "Павлодар",
  "Petropavlovsk": "Петропавловск",      "Taraz": "Тараз",
  "Turkestan": "Туркестан", "Uralsk":    "Уральск",
  "Ust-Kamenogorsk": "Усть-Каменогорск", "Shymkent": "Шымкент"
}

app.get('/', (req, res) => {
  res.render('index', { error: null });
});


app.post('/get-info', async (req, res) => {
  const city = req.body.city;

  const newsCity = CITY_NEWS_MAPPING[city] || city;

  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${process.env.WEATHER_API_KEY}`;
  const newsUrl = `https://newsapi.org/v2/everything?q=${newsCity}&language=ru&sortBy=publishedAt&apiKey=${process.env.NEWS_API_KEY}`;
  const placesUrl = `https://catalog.api.2gis.com/3.0/items?q=достопримечательности ${city}&key=${process.env.TWOGIS_API_KEY}`;

  try {
    const [weatherResponse, newsResponse, placesResponse] = await Promise.all([
      axios.get(weatherUrl),
      axios.get(newsUrl),
      axios.get(placesUrl)
    ]);

    const weatherData = weatherResponse.data;
    const newsData = newsResponse.data;
    const placesData = placesResponse.data;

    const weather = {
      city: weatherData.name,
      temp: weatherData.main.temp,
      description: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon,
      coordinates: weatherData.coord,
      feels_like: weatherData.main.feels_like,
      humidity: weatherData.main.humidity,
      pressure: weatherData.main.pressure,
      wind_speed: weatherData.wind.speed,
      country: weatherData.sys.country,
      rain: weatherData.rain ? weatherData.rain['3h'] || 0 : 0
    };

    res.render('dashboard', {
      weather: weather,
      news: newsData.articles.slice(0, 5),
      places: placesData.result.items.slice(0, 6),
      error: null
    });

  } catch (error) {
    console.error("Error receiving data:", error.message);
    let errorMessage = "Unable to retrieve data. Please check the city name.";

    if (error.response) {
      if (error.response.status === 404) {
        errorMessage = "City not found. Try a different name.";
      }
    }

    res.render('index', { error: errorMessage });
  }
});


// Endpoint for testing with Postman
app.get('/api/weather', async (req, res) => {
  const city = req.query.city;

  const newsCity = CITY_NEWS_MAPPING[city] || city;

  if (!city) {
    return res.status(400).json({ error: "Please, specify a city name" });
  }

  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${process.env.WEATHER_API_KEY}`;
    const newsUrl = `https://newsapi.org/v2/everything?q=${newsCity}&language=ru&sortBy=publishedAt&apiKey=${process.env.NEWS_API_KEY}`;
    const placesUrl = `https://catalog.api.2gis.com/3.0/items?q=достопримечательности ${city}&key=${process.env.TWOGIS_API_KEY}`;

    const [weatherResponse, newsResponse, placesResponse] = await Promise.all([
      axios.get(weatherUrl),
      axios.get(newsUrl),
      axios.get(placesUrl)
    ]);

    const responseData = {
      weather: {
        city: weatherResponse.data.name,
        temp: weatherResponse.data.main.temp,
        condition: weatherResponse.data.weather[0].description
      },
      news: newsResponse.data.articles.slice(0, 3),
      places: placesResponse.data.result.items.slice(0, 3)
    };

    res.status(200).json(responseData);

  } catch (error) {
    if (error.response && error.response.status === 404) {
      res.status(404).json({ error: "City not found" });
    } else {
      res.status(500).json({ error: "Server error" });
    }
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});