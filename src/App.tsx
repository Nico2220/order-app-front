import React, { useEffect, useState } from "react";
import "./App.css";
import Box from "@mui/material/Box";
import {
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Collapse,
} from "@mui/material/";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

const usersData: User[] = [
  { id: "1", name: "Jon Doe" },
  { id: "2", name: "Tim" },
  { id: "3", name: "Tom" },
];

type User = {
  id: string;
  name: string;
};
type Order = {
  users: string[];
  orderDate: string | Dayjs;
};
const BASE_URL = "http://localhost:3001";

dayjs.extend(utc);
dayjs.extend(timezone);
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

function App() {
  const [userId, setUserId] = useState("1");
  const [value, setValue] = React.useState<Dayjs | null>(dayjs().tz(tz));
  const [order, setOder] = useState<Order>();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAvalaibleDate = async () => {
      const response = await fetch(`${BASE_URL}/available-date`);
      const avalDate = (await response.json()) as { availableDate: string };
      setValue(dayjs(avalDate.availableDate));
    };

    fetchAvalaibleDate();
  }, [order]);

  const handleClick = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/order/${userId}/${value?.tz(tz)}`,
        {
          method: "post",
        }
      );

      if (!response.ok) {
        const errorJson = await response.json();
        setError(errorJson.message);
        return;
      }
      const table = (await response.json()) as { orders: Order[] };
      const lastOder = table.orders[table.orders.length - 1];
      setOder(lastOder);
      updateMessage(lastOder);
    } catch (err) {}
  };

  const updateMessage = (lastOrder: Order) => {
    if (lastOrder && lastOrder.users.length === 1) {
      setMessage(
        `An order has been initiated at ${dayjs(lastOrder.orderDate).format(
          "DD-MM-YYYY HH:mm"
        )}, There is one empty seat`
      );
    } else if (lastOrder && lastOrder.users.length === 2) {
      setMessage(
        `Order at ${dayjs(lastOrder.orderDate).format(
          "DD-MM-YYYY HH:mm"
        )} is completed`
      );
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <Box sx={{ mt: 2, textAlign: "center" }}>
        <FormControl sx={{ mr: 2 }}>
          <InputLabel id="user-select-label">Users</InputLabel>
          <Select
            labelId="user-select-label"
            id="userId"
            value={userId}
            label="Users"
            onChange={(e) => setUserId(e.target.value as string)}
          >
            {usersData.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <DateTimePicker
          sx={{ mr: 2 }}
          label="Calendar"
          value={value}
          onChange={(newValue) => setValue(newValue)}
          views={["year", "month", "day", "hours", "minutes"]}
          minDateTime={value}
          ampm={false}
          disabled={order?.users.length === 1}
        />

        <Button variant="contained" onClick={handleClick}>
          {order?.users.length === 1 ? "confirm Order" : "Initiate Order"}
        </Button>

        {order && order.users.length === 1 ? (
          <DisplayMessage
            message={message}
            setMessage={setMessage}
            severity="info"
          />
        ) : null}

        {order && order.users.length === 2 ? (
          <DisplayMessage
            message={message}
            setMessage={setMessage}
            severity="success"
          />
        ) : null}

        {error && (
          <DisplayMessage
            message={error}
            setMessage={setError}
            severity="error"
          />
        )}
      </Box>
    </LocalizationProvider>
  );
}

type Props = {
  message: string;
  setMessage: Function;
  severity: "error" | "info" | "warning" | "success";
};

function DisplayMessage({ message, setMessage, severity }: Props) {
  return (
    <Collapse in={Boolean(message)}>
      <Alert
        sx={{
          mt: 2,
          width: "50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
        onClose={() => {
          setMessage("");
        }}
        severity={severity}
      >
        {message}
      </Alert>
    </Collapse>
  );
}

export default App;
