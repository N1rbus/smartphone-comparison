import React from "react";
import { Typography, Box, Button } from "@mui/material";

function ConsoleLogger({ logs }) {
  return (
    <Box sx={{ border: "1px solid #ccc", p: 2, mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Логи запросов:
      </Typography>
      {logs.length === 0 ? (
        <Typography>Нет данных для отображения.</Typography>
      ) : (
        logs.map((log, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Запрос #{index + 1}
            </Typography>
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
              {JSON.stringify(log, null, 2)}
            </pre>
          </Box>
        ))
      )}
      <Button
        variant="contained"
        color="secondary"
        onClick={() => window.scrollTo(0, document.body.scrollHeight)} // Прокрутка к логам
        sx={{ mt: 2 }}
      >
        Просмотреть логи
      </Button>
    </Box>
  );
}

export default ConsoleLogger;