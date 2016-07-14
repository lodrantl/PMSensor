## InfluxDB queries used in this project

### Return last value
`select * from "particulates.12342" where time > now() - 1m order by time desc limit 1`

### Test connection