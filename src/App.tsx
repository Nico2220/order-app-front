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
  Typography,
} from "@mui/material/";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

const usersData: User[] = [
  { id: "1", name: "Jon Doe", timezone: "Europe/Berlin" },
  { id: "2", name: "Tim Ali", timezone: "Europe/Moscow" },
  { id: "3", name: "Tom Eric", timezone: "America/Toronto" },
];

type User = {
  id: string;
  name: string;
  timezone: string;
};
type Order = {
  users: string[];
  orderDate: string | Dayjs;
};
const BASE_URL = "http://localhost:3001";

dayjs.extend(utc);
dayjs.extend(timezone);

function App() {
  const [user, setUser] = useState(usersData[0]);
  const [value, setValue] = React.useState<Dayjs | null>(
    dayjs().tz(user.timezone)
  );
  const [minDateTime, setMinDateTime] = React.useState<Dayjs | null>(null);
  const [order, setOder] = useState<Order>();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAvailableDate = async () => {
      const response = await fetch(
        `${BASE_URL}/available-date?timezone=${user.timezone}`
      );
      const availableDateJson = (await response.json()) as {
        availableDate: string;
      };
      setValue(dayjs(availableDateJson.availableDate));
      setMinDateTime(dayjs(availableDateJson.availableDate));
    };

    fetchAvailableDate();
  }, [user, order]);

  const handleClick = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/order/${user.id}/${value?.format()}`,
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
    } catch (err) {}
  };

  useEffect(() => {
    if (!order) return;
    updateMessage();
  }, [user, order, minDateTime]);

  const updateMessage = () => {
    if (order && order.users.length === 1) {
      setMessage(
        `Order has been initiated at ${dayjs(order.orderDate)
          .tz(user.timezone)
          .format("DD-MM-YYYY HH:00")}, There is one empty seat left`
      );
    } else if (order && order.users.length === 2) {
      setMessage(
        `Order at ${dayjs(order.orderDate)
          .tz(user.timezone)
          .format(
            "DD-MM-YYYY HH:00"
          )} is closed, The next available date is ${minDateTime
          ?.tz(user.timezone)
          .format("DD-MM-YYYY HH:00")}`
      );
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Typography sx={{ textAlign: "center", mt: 2 }}>
        When ever you shoose a user , It's kind of simulate the current logged
        in user. The current logged in User is : <strong>{user.name}</strong>{" "}
        with the timezone <strong>{user.timezone}</strong>
      </Typography>
      <Box
        sx={{
          mt: 2,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
        }}
      >
        <FormControl sx={{ mr: 2 }}>
          <InputLabel id="user-select-label">Users</InputLabel>
          <Select
            size="medium"
            labelId="user-select-label"
            id="user"
            value={user.id}
            label="Users"
            onChange={(e) => {
              setUser(usersData[+e.target.value - 1]);
            }}
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
          views={["year", "month", "day", "hours"]}
          minDateTime={minDateTime}
          ampm={false}
          disabled={order?.users.length === 1}
          format="DD/MM/YY HH:00"
          timezone={user.timezone}
        />

        <Button
          variant="contained"
          onClick={handleClick}
          disabled={
            order && order.users.length === 1 && order.users.includes(user.id)
          }
        >
          {order?.users.length === 1 ? "confirm Order" : "Initiate Order"}
        </Button>
      </Box>

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
    <Box sx={{ display: "flex", justifyContent: "center" }}>
      <Collapse in={Boolean(message)} sx={{ width: "50%" }}>
        <Alert
          sx={{
            mt: 2,

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
    </Box>
  );
}

export default App;
