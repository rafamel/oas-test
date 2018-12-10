import express from 'express';
import bodyParser from 'body-parser';

// Initialize Express
const app = express();
app.use(bodyParser.json()); // Parse JSON

app.get('/api/wappwooas', (req, res, next) => {
  res.json({ data: 'response' });
});

app.post('/api/wappwooas/data', (req, res, next) => {
  res.json({
    query: req.query,
    body: req.body,
    headers: req.headers
  });
});

app.get('/foo/bar/api/wappwooas', (req, res, next) => {
  res.json({ foo: 'bar' });
});

app.get('/foo/bar/api/todo', (req, res, next) => {
  res.json({ foo: 'bar' });
});

app.get('/api/todo', (req, res, next) => {
  res.json({ data: 'response' });
});

app.get('/api/todo/200', (req, res, next) => {
  res.json({
    status: 'success',
    data: []
  });
});

app.put('/api/todo/:id', (req, res, next) => {
  if (req.params.id && req.headers.some) {
    res.set('bar', 'is string');
    res.set('foobar', 'is string');
  }
  res.json({});
});

export default app;
