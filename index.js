require("dotenv").config();

const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");
const express = require("express");
const path = require("path");
const fs = require("fs");

// app
const app = express();

// ENV variables
const TMBD_READ_ACCESS_TOKEN = process.env.TMBD_READ_ACCESS_TOKEN;
const SECRET_KEY = process.env.SECRET_KEY || "defaultsecret";
const PORT = process.env.PORT || 3000;

// Configurazione
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PWA Config
app.get("/manifest.json", (req, res) => {
  res.sendFile(path.join(__dirname, "manifest.json"));
});

app.get("/service-worker.js", (req, res) => {
  res.set("Service-Worker-Allowed", "/");
  res.sendFile(path.join(__dirname, "public/service-worker.js"));
});

// Middleware per verificare l'autenticazione via JWT
const isAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  next();
};

// Middleware globale per aggiungere user a tutte le richieste
app.use((req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      req.user = jwt.verify(token, SECRET_KEY).username;
    } catch (err) {
      res.clearCookie("token");
      req.user = null;
    }
  } else {
    req.user = null;
  }
  res.locals.user = req.user; // Passa l'utente a tutte le viste
  next();
});

// Percorso del database JSON
const moviesDBFile =
  process.env.ENVIRONMENT === "development"
    ? "movies.test.json"
    : "movies.json";
const moviesTable = path.join(__dirname, moviesDBFile);
const usersTable = path.join(__dirname, "users.json");

// Funzione per leggere i dati
const readData = (path) => {
  if (!fs.existsSync(path)) return [];
  const data = fs.readFileSync(path);
  return JSON.parse(data);
};

// Funzione per scrivere i dati
const writeData = (data) => {
  fs.writeFileSync(moviesTable, JSON.stringify(data, null, 2));
};

/***************************************************************
 * POST REQUESTS
 ***************************************************************/
// Renderizza la pagina di login
app.get("/login", (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }
  res.render("login");
});

// Rotta per il logout
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

// Rotta per modificare un film esistente (protetta)
app.get("/edit/:id", isAuthenticated, (req, res) => {
  // get the user rating the movie from the token
  let user = null;
  if (req.cookies.token) {
    user = jwt.verify(req.cookies.token, SECRET_KEY);
  }
  const movies = readData(moviesTable);
  const movie = movies.find((m) => m.id === parseInt(req.params.id));
  if (!movie) return res.status(404).send("Film non trovato");
  res.render("edit", { movie, user });
});

// Rotta per cercare film tramite TMDB
app.get("/search", isAuthenticated, async (req, res) => {
  const query = req.query.query;

  const movies = readData(moviesTable);
  const movieIds = movies.map((m) => m.id);

  if (!query) {
    return res.json({ results: [] });
  }

  const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
    query
  )}&include_adult=false&language=en-US&page=1`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${TMBD_READ_ACCESS_TOKEN}`,
    },
  };

  // get the user rating the movie from the token
  let user = null;
  if (req.cookies.token) {
    user = jwt.verify(req.cookies.token, SECRET_KEY);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    // check if the movie is already in the database
    const results = data.results.map((movie) => {
      const isAdded = movieIds.includes(movie.id);
      return { ...movie, isAdded, user };
    });

    res.json({ results });
  } catch (error) {
    console.error("Errore durante la ricerca del film:", error);
    res.status(500).json({ error: "Errore durante la ricerca del film" });
  }
});

// Rotta per il form di creazione di un nuovo film (protetta)
app.get("/new", isAuthenticated, (req, res) => {
  // get the user rating the movie from the token
  let user = null;
  if (req.cookies.token) {
    user = jwt.verify(req.cookies.token, SECRET_KEY);
  }
  res.render("new", { user });
});

// Rotta per visualizzare un film
app.get("/:id", isAuthenticated, (req, res) => {
  // get the user rating the movie from the token
  let user = null;
  if (req.cookies.token) {
    user = jwt.verify(req.cookies.token, SECRET_KEY);
  }

  const movies = readData(moviesTable);
  const movie = movies.find((m) => m.id === parseInt(req.params.id));
  if (!movie) return res.status(404).send("Film non trovato");
  res.render("show", { movie, user });
});

// Rotta principale: mostra tutti i film
app.get("/", (req, res) => {
  const movies = readData(moviesTable);
  // get the user rating the movie from the token
  let user = null;
  if (req.cookies.token) {
    user = jwt.verify(req.cookies.token, SECRET_KEY);
  }

  res.render("index", {
    movies,
    user,
  });
});
/***************************************************************
 * POST REQUESTS
 ***************************************************************/
// Rotta per il login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const users = readData(usersTable);

  const user = users.find(
    (u) =>
      u.username.toLocaleLowerCase() === username.toLocaleLowerCase() &&
      u.password === password
  );

  if (!user) {
    console.log("Login failed. Invalid credentials");
    return res.render("login", { error: "Your credentials are incorrect" });
  }

  const token = jwt.sign(user, SECRET_KEY);
  res.cookie("token", token, { httpOnly: true });
  return res.redirect("/");
});

// Rotta per aggiungere un nuovo film (protetta)
app.post("/new", isAuthenticated, (req, res) => {
  const movies = readData(moviesTable);
  // rcreate a random Id from letter and numbers
  const id = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("")
    .substring(0, 10)
    .replace(/(.{5})/g, "$1-")
    .slice(0, -1);

  const newMovie = {
    id: "MANUAL-" + id,
    title: req.body.title,
    notes: req.body.notes,
    rating: 0,
    total_reviews: 0,
    thumbnail: req.body.thumbnail,
    ratings: {},
  };
  movies.push(newMovie);
  writeData(movies);
  res.redirect("/");
});

// Rotta per aggiornare la valutazione di un film (protetta)
app.post("/rate/:id", isAuthenticated, (req, res) => {
  let movies = readData(moviesTable);
  const movieId = parseInt(req.params.id);
  const newRating = parseFloat(req.body.rating);

  // get the user rating the movie from the token
  const user = jwt.verify(req.cookies.token, SECRET_KEY);

  let selectedMovie;
  let isNewReview = true;
  movies = movies.map((movie) => {
    if (movie.id === movieId) {
      // verifica se l'utente ha già recensito il film
      if (movie.ratings && movie.ratings[user.username]) {
        isNewReview = false;
      }

      // Se il film non ha ancora recensioni, inizializza i valori
      if (!movie.total_reviews) {
        movie.total_reviews = 0;
        movie.rating = 0;
      }

      if (!movie.ratings) movie.ratings = {};
      movie.ratings[user.username] = newRating;
      movie.total_reviews = Object.keys(movie.ratings).length;

      // Questo deve venire dopo il calcolo di total_reviews per evitare di contare la recensione dell'utente due volte
      movie.rating = (movie.rating + newRating) / movie.total_reviews;
      movie.rating = Math.round(movie.rating * 10) / 10;

      selectedMovie = movie;
    }

    return movie;
  });

  writeData(movies);
  res.send({ movie: selectedMovie, isNewReview }).status(200);
});

// Rotta per aggiornare un film esistente (protetta)
app.post("/edit/:id", isAuthenticated, (req, res) => {
  let movies = readData(moviesTable);
  movies = movies.map((m) => {
    if (m.id === parseInt(req.params.id)) {
      m.title = req.body.title;
      m.notes = req.body.notes;
      m.rating = parseInt(req.body.rating);
    }
    return m;
  });
  writeData(movies);
  res.redirect("/");
});

// Rotta per eliminare un film (protetta)
app.post("/delete/:id", isAuthenticated, (req, res) => {
  let movies = readData(moviesTable);
  movies = movies.filter((m) => m.id !== parseInt(req.params.id));
  writeData(movies);
  res.redirect("/");
});

// Rotta per aggiungere un film tramite TMDB
app.post("/add-from-tmdb", isAuthenticated, async (req, res) => {
  const id = req.body.id;

  if (!id) {
    return res.status(400).json({ error: "ID del film mancante" });
  }

  const movies = readData(moviesTable);

  // const url = `https://api.themoviedb.org/3/movie/${id}?language=en-US`;
  const thumbnail = req.body.thumbnail;
  const title = req.body.title;
  const total_reviews = 0;
  const total_rating = 0;

  const newMovie = {
    id,
    title,
    total_reviews,
    total_rating,
    thumbnail,
  };

  movies.push(newMovie);
  writeData(movies);
  res.status(201).json(newMovie);
});

// mostra utti i dettagli di un film
app.get("/movie-details/:id", async (req, res) => {
  const movieId = req.params.id;
  const url = `https://api.themoviedb.org/3/movie/${movieId}?language=en-US`;

  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${TMBD_READ_ACCESS_TOKEN}`,
    },
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Failed to fetch movie details" });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching movie details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/***************************************************************
 * ASCOLTA E SERVE
 ***************************************************************/
// Avvio del server
app.listen(PORT, () => {
  console.log(`Server in esecuzione su http://localhost:${PORT}`);
});
