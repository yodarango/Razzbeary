require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || "defaultsecret";
const USER_CREDENTIALS = {
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
};

// Configurazione
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// PWA Config
app.get("/manifest.json", (req, res) => {
  res.sendFile(path.join(__dirname, "public/manifest.json"));
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
const dbFile =
  process.env.ENVIRONMENT === "development"
    ? "movies.test.json"
    : "movies.json";
const dbPath = path.join(__dirname, dbFile);

// Funzione per leggere i dati
const readData = () => {
  if (!fs.existsSync(dbPath)) return [];
  const data = fs.readFileSync(dbPath);
  return JSON.parse(data);
};

// Funzione per scrivere i dati
const writeData = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// Rotta per il login
app.get("/login", (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }
  res.render("login");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (
    username.toLocaleLowerCase() ===
      USER_CREDENTIALS.username.toLocaleLowerCase() &&
    password === USER_CREDENTIALS.password
  ) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
    res.cookie("token", token, { httpOnly: true });
    return res.redirect("/");
  } else {
    res.render("login", { error: "Credenziali non valide" });
  }
});

// Rotta per il logout
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

// Rotta principale: mostra tutti i film
app.get("/", (req, res) => {
  const movies = readData();
  res.render("index", {
    movies,
  });
});

// Rotta per il form di creazione di un nuovo film (protetta)
app.get("/new", isAuthenticated, (req, res) => {
  res.render("new");
});

// Rotta per visualizzare un film
app.get("/:id", isAuthenticated, (req, res) => {
  const movies = readData();
  const movie = movies.find((m) => m.id === parseInt(req.params.id));
  if (!movie) return res.status(404).send("Film non trovato");
  res.render("show", { movie });
});

// Rotta per aggiungere un nuovo film (protetta)
app.post("/new", isAuthenticated, (req, res) => {
  const movies = readData();
  const newMovie = {
    id: movies.length ? movies[movies.length - 1].id + 1 : 1,
    title: req.body.title,
    notes: req.body.notes,
    rating: 0,
    total_reviews: 0,
    thumbnail: req.body.thumbnail, // Salvataggio del nuovo campo
  };
  movies.push(newMovie);
  writeData(movies);
  res.redirect("/");
});

// Rotta per aggiornare la valutazione di un film (protetta)
app.post("/rate/:id", isAuthenticated, (req, res) => {
  let movies = readData();
  const movieId = parseInt(req.params.id);
  const newRating = parseInt(req.body.rating);

  movies = movies.map((movie) => {
    if (movie.id === movieId) {
      // Se il film non ha ancora recensioni, inizializza i valori
      if (!movie.total_reviews) {
        movie.total_reviews = 0;
        movie.rating = 0;
      }

      // Calcola la nuova media: (rating attuale * numero recensioni + nuova valutazione) / (numero recensioni + 1)
      movie.rating =
        (movie.rating * movie.total_reviews + newRating) /
        (movie.total_reviews + 1);
      movie.rating = Math.round(movie.rating * 10) / 10; // Arrotonda a una cifra decimale
      movie.total_reviews += 1; // Incrementa il numero totale di recensioni
    }
    return movie;
  });

  writeData(movies);
  res.redirect("/");
});

// Rotta per modificare un film esistente (protetta)
app.get("/edit/:id", isAuthenticated, (req, res) => {
  const movies = readData();
  const movie = movies.find((m) => m.id === parseInt(req.params.id));
  if (!movie) return res.status(404).send("Film non trovato");
  res.render("edit", { movie });
});

// Rotta per aggiornare un film esistente (protetta)
app.post("/edit/:id", isAuthenticated, (req, res) => {
  let movies = readData();
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
  let movies = readData();
  movies = movies.filter((m) => m.id !== parseInt(req.params.id));
  writeData(movies);
  res.redirect("/");
});

// Avvio del server
app.listen(PORT, () => {
  console.log(`Server in esecuzione su http://localhost:${PORT}`);
});
