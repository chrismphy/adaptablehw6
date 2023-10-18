--
-- PostgreSQL database dump
--

-- Dumped from database version 16.0
-- Dumped by pg_dump version 16.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: adminpack; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS adminpack WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION adminpack; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION adminpack IS 'administrative functions for PostgreSQL';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: students; Type: TABLE; Schema: public; Owner: chrismphy
--

CREATE TABLE public.students (
    record_id bigint NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    gpa numeric(3,2),
    enrolled boolean,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.students OWNER TO chrismphy;

--
-- Name: students_record_id_seq; Type: SEQUENCE; Schema: public; Owner: chrismphy
--

CREATE SEQUENCE public.students_record_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.students_record_id_seq OWNER TO chrismphy;

--
-- Name: students_record_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: chrismphy
--

ALTER SEQUENCE public.students_record_id_seq OWNED BY public.students.record_id;


--
-- Name: students record_id; Type: DEFAULT; Schema: public; Owner: chrismphy
--

ALTER TABLE ONLY public.students ALTER COLUMN record_id SET DEFAULT nextval('public.students_record_id_seq'::regclass);


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: chrismphy
--

COPY public.students (record_id, first_name, last_name, gpa, enrolled, uploaded_at) FROM stdin;
1677444950300	John	Doe	3.00	t	2023-10-18 13:48:52.217
1677444956126	Janet	Doe	5.00	f	2023-10-18 13:48:52.391
1677444963727	Jim	Beam	3.00	t	2023-10-18 13:48:52.392
1695689615083	jalen	carter	0.30	f	2023-10-18 13:48:52.393
1695690922065	test	test	4.00	t	2023-10-18 13:48:52.394
1695691212776	test2	test2	3.40	t	2023-10-18 13:48:52.395
1695691913675	test	test3	3.00	t	2023-10-18 13:48:52.397
1695697787450	jalen	carter	0.01	t	2023-10-18 13:48:52.398
1695755561006	chris	murphy	3.20	t	2023-10-18 13:48:52.399
1695855984976	chris	murphy	2.10	f	2023-10-18 13:48:52.4
1695866803128	christopher	murphy	3.20	t	2023-10-18 13:58:51.996
1697661485057	testing	test	2.20	t	2023-10-18 16:38:05.060562
\.


--
-- Name: students_record_id_seq; Type: SEQUENCE SET; Schema: public; Owner: chrismphy
--

SELECT pg_catalog.setval('public.students_record_id_seq', 1, false);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: chrismphy
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (record_id);


--
-- PostgreSQL database dump complete
--

