const express = require('express')
const app = express()
const path = require('path')
const boiling_warriors = require('./seeds/index')
const jokes = require('./seeds/jokes')
const helmet = require('helmet')
const xss = require('xss')

// Security middleware with updated CSP
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            fontSrc: ["'self'", "https:", "http:", "data:"],
            connectSrc: ["'self'", "https://icanhazdadjoke.com"],
            upgradeInsecureRequests: null  // Remove forced HTTPS upgrade
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}))

// XSS protection middleware
app.use((req, res, next) => {
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = xss(req.body[key]);
            }
        });
    }
    next();
});

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files with correct MIME types
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}))

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.get('/', (req, res) =>{
    res.render('index')
})

app.post('/joke', async(req, res) => {
    const jokeType = req.body.jokeType;
    
    if (jokeType === 'api') {
        try {
            const response = await fetch('https://icanhazdadjoke.com/', {
                headers: {
                    Accept: 'application/json',
                },
            })
            const data = await response.json()
            res.render('joke', { joke: data.joke, source: 'Dad Joke API' })
        } catch (error) {
            res.render('joke', { joke: 'Sorry, could not fetch a dad joke at this time.', source: 'Error' })
        }
    } else {
        const randomJoke = jokes[Math.floor(Math.random() * jokes.length)]
        res.render('joke', { joke: randomJoke, source: 'Kullu Jokes' })
    }
})

app.get('/boiling_warriors', (req, res) => {
    res.render('boiling_warriors', { boiling_warriors })
    // console.log(boiling_warriors)
})

app.listen(5000, () =>{
    console.log('Server is running on port 5000')
})
