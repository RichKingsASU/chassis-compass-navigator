SET statement_timeout='15min';
\copy public.anytrek_status ("Device Id","Vehicle","Group","Landmark","Enter Time(US/Pacific)","Dwell Time","Country","Driving Status","Driving Direction","Speed(mp/h)","Lat","Lng","Last Location(UTC)","state/province","address") FROM STDIN WITH (FORMAT csv, HEADER true, DELIMITER ',');
