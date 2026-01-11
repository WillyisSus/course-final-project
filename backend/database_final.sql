--
-- PostgreSQL database dump
--

\restrict N2QO4eyo4cs7W0pgRYzpgHreYWugpuu3uFTNXotajTdaJvws80sqIWrL2VFfgTo

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.10

-- Started on 2026-01-11 07:17:23 UTC

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

DROP DATABASE IF EXISTS "project-final";
--
-- TOC entry 3676 (class 1262 OID 25066)
-- Name: project-final; Type: DATABASE; Schema: -; Owner: myuser
--

CREATE DATABASE "project-final" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE "project-final" OWNER TO myuser;

\unrestrict N2QO4eyo4cs7W0pgRYzpgHreYWugpuu3uFTNXotajTdaJvws80sqIWrL2VFfgTo
\encoding SQL_ASCII
\connect -reuse-previous=on "dbname='project-final'"
\restrict N2QO4eyo4cs7W0pgRYzpgHreYWugpuu3uFTNXotajTdaJvws80sqIWrL2VFfgTo

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
-- TOC entry 6 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 3677 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 923 (class 1247 OID 25172)
-- Name: bid_status; Type: TYPE; Schema: public; Owner: myuser
--

CREATE TYPE public.bid_status AS ENUM (
    'VALID',
    'REJECTED',
    'CANCELLED'
);


ALTER TYPE public.bid_status OWNER TO myuser;

--
-- TOC entry 971 (class 1247 OID 26125)
-- Name: product_receipt_status; Type: TYPE; Schema: public; Owner: myuser
--

CREATE TYPE public.product_receipt_status AS ENUM (
    'PENDING',
    'FINISHED',
    'CANCELED'
);


ALTER TYPE public.product_receipt_status OWNER TO myuser;

--
-- TOC entry 920 (class 1247 OID 25164)
-- Name: product_status; Type: TYPE; Schema: public; Owner: myuser
--

CREATE TYPE public.product_status AS ENUM (
    'ACTIVE',
    'SOLD',
    'EXPIRED',
    'HOLDING'
);


ALTER TYPE public.product_status OWNER TO myuser;

--
-- TOC entry 926 (class 1247 OID 25180)
-- Name: request_status; Type: TYPE; Schema: public; Owner: myuser
--

CREATE TYPE public.request_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public.request_status OWNER TO myuser;

--
-- TOC entry 917 (class 1247 OID 25156)
-- Name: user_role; Type: TYPE; Schema: public; Owner: myuser
--

CREATE TYPE public.user_role AS ENUM (
    'ADMIN',
    'SELLER',
    'BIDDER'
);


ALTER TYPE public.user_role OWNER TO myuser;

--
-- TOC entry 288 (class 1255 OID 25393)
-- Name: products_tsv_trigger(); Type: FUNCTION; Schema: public; Owner: myuser
--

CREATE FUNCTION public.products_tsv_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS '
BEGIN
  NEW.tsv := to_tsvector(''simple'', unaccent(NEW.name));
  RETURN NEW;
END
';


ALTER FUNCTION public.products_tsv_trigger() OWNER TO myuser;

--
-- TOC entry 289 (class 1255 OID 25398)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: myuser
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS '
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
';


ALTER FUNCTION public.update_updated_at_column() OWNER TO myuser;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 240 (class 1259 OID 25296)
-- Name: auto_bids; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public.auto_bids (
    auto_bid_id integer NOT NULL,
    product_id integer NOT NULL,
    bidder_id integer NOT NULL,
    max_price numeric(15,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.auto_bids OWNER TO myuser;

--
-- TOC entry 239 (class 1259 OID 25295)
-- Name: auto_bids_auto_bid_id_seq; Type: SEQUENCE; Schema: public; Owner: myuser
--

CREATE SEQUENCE public.auto_bids_auto_bid_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auto_bids_auto_bid_id_seq OWNER TO myuser;

--
-- TOC entry 3678 (class 0 OID 0)
-- Dependencies: 239
-- Name: auto_bids_auto_bid_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myuser
--

ALTER SEQUENCE public.auto_bids_auto_bid_id_seq OWNED BY public.auto_bids.auto_bid_id;


--
-- TOC entry 238 (class 1259 OID 25276)
-- Name: bids; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public.bids (
    bid_id integer NOT NULL,
    product_id integer NOT NULL,
    bidder_id integer NOT NULL,
    amount numeric(15,2) NOT NULL,
    status public.bid_status DEFAULT 'VALID'::public.bid_status,
    "time" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_bid_amount CHECK ((amount > (0)::numeric))
);


ALTER TABLE public.bids OWNER TO myuser;

--
-- TOC entry 237 (class 1259 OID 25275)
-- Name: bids_bid_id_seq; Type: SEQUENCE; Schema: public; Owner: myuser
--

CREATE SEQUENCE public.bids_bid_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bids_bid_id_seq OWNER TO myuser;

--
-- TOC entry 3679 (class 0 OID 0)
-- Dependencies: 237
-- Name: bids_bid_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myuser
--

ALTER SEQUENCE public.bids_bid_id_seq OWNED BY public.bids.bid_id;


--
-- TOC entry 241 (class 1259 OID 25315)
-- Name: blocked_bidders; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public.blocked_bidders (
    product_id integer NOT NULL,
    user_id integer NOT NULL,
    blocked_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    reason character varying(255)
);


ALTER TABLE public.blocked_bidders OWNER TO myuser;

--
-- TOC entry 230 (class 1259 OID 25205)
-- Name: categories; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public.categories (
    category_id integer NOT NULL,
    parent_id integer,
    name character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categories OWNER TO myuser;

--
-- TOC entry 229 (class 1259 OID 25204)
-- Name: categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: myuser
--

CREATE SEQUENCE public.categories_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_category_id_seq OWNER TO myuser;

--
-- TOC entry 3680 (class 0 OID 0)
-- Dependencies: 229
-- Name: categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myuser
--

ALTER SEQUENCE public.categories_category_id_seq OWNED BY public.categories.category_id;


--
-- TOC entry 243 (class 1259 OID 25332)
-- Name: feedbacks; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public.feedbacks (
    feedback_id integer NOT NULL,
    product_id integer NOT NULL,
    from_user_id integer NOT NULL,
    to_user_id integer NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT feedbacks_rating_check CHECK ((rating = ANY (ARRAY[1, '-1'::integer])))
);


ALTER TABLE public.feedbacks OWNER TO myuser;

--
-- TOC entry 242 (class 1259 OID 25331)
-- Name: feedbacks_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: myuser
--

CREATE SEQUENCE public.feedbacks_feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feedbacks_feedback_id_seq OWNER TO myuser;

--
-- TOC entry 3681 (class 0 OID 0)
-- Dependencies: 242
-- Name: feedbacks_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myuser
--

ALTER SEQUENCE public.feedbacks_feedback_id_seq OWNED BY public.feedbacks.feedback_id;


--
-- TOC entry 250 (class 1259 OID 25427)
-- Name: messages; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public.messages (
    message_id integer NOT NULL,
    sender_id integer NOT NULL,
    receiver_id integer NOT NULL,
    content text,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    product_id integer
);


ALTER TABLE public.messages OWNER TO myuser;

--
-- TOC entry 249 (class 1259 OID 25426)
-- Name: messages_message_id_seq; Type: SEQUENCE; Schema: public; Owner: myuser
--

CREATE SEQUENCE public.messages_message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_message_id_seq OWNER TO myuser;

--
-- TOC entry 3682 (class 0 OID 0)
-- Dependencies: 249
-- Name: messages_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myuser
--

ALTER SEQUENCE public.messages_message_id_seq OWNED BY public.messages.message_id;


--
-- TOC entry 248 (class 1259 OID 25400)
-- Name: product_comments; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public.product_comments (
    comment_id integer NOT NULL,
    product_id integer NOT NULL,
    user_id integer NOT NULL,
    parent_id integer,
    content text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.product_comments OWNER TO myuser;

--
-- TOC entry 247 (class 1259 OID 25399)
-- Name: product_comments_comment_id_seq; Type: SEQUENCE; Schema: public; Owner: myuser
--

CREATE SEQUENCE public.product_comments_comment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_comments_comment_id_seq OWNER TO myuser;

--
-- TOC entry 3683 (class 0 OID 0)
-- Dependencies: 247
-- Name: product_comments_comment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myuser
--

ALTER SEQUENCE public.product_comments_comment_id_seq OWNED BY public.product_comments.comment_id;


--
-- TOC entry 234 (class 1259 OID 25245)
-- Name: product_descriptions; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public.product_descriptions (
    desc_id integer NOT NULL,
    product_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.product_descriptions OWNER TO myuser;

--
-- TOC entry 233 (class 1259 OID 25244)
-- Name: product_descriptions_desc_id_seq; Type: SEQUENCE; Schema: public; Owner: myuser
--

CREATE SEQUENCE public.product_descriptions_desc_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_descriptions_desc_id_seq OWNER TO myuser;

--
-- TOC entry 3684 (class 0 OID 0)
-- Dependencies: 233
-- Name: product_descriptions_desc_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myuser
--

ALTER SEQUENCE public.product_descriptions_desc_id_seq OWNED BY public.product_descriptions.desc_id;


--
-- TOC entry 236 (class 1259 OID 25260)
-- Name: product_images; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public.product_images (
    image_id integer NOT NULL,
    product_id integer NOT NULL,
    image_url character varying(500) NOT NULL,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.product_images OWNER TO myuser;

--
-- TOC entry 235 (class 1259 OID 25259)
-- Name: product_images_image_id_seq; Type: SEQUENCE; Schema: public; Owner: myuser
--

CREATE SEQUENCE public.product_images_image_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_images_image_id_seq OWNER TO myuser;

--
-- TOC entry 3685 (class 0 OID 0)
-- Dependencies: 235
-- Name: product_images_image_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myuser
--

ALTER SEQUENCE public.product_images_image_id_seq OWNED BY public.product_images.image_id;


--
-- TOC entry 252 (class 1259 OID 26096)
-- Name: product_receipts; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public.product_receipts (
    receipt_id integer NOT NULL,
    product_id integer NOT NULL,
    buyer_id integer NOT NULL,
    seller_id integer NOT NULL,
    amount double precision NOT NULL,
    paid_by_buyer boolean DEFAULT false,
    confirmed_by_seller boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    confirmed_by_buyer boolean DEFAULT false,
    status public.product_receipt_status DEFAULT 'PENDING'::public.product_receipt_status,
    paypal_order text
);


ALTER TABLE public.product_receipts OWNER TO myuser;

--
-- TOC entry 251 (class 1259 OID 26095)
-- Name: product_receipts_receipt_id_seq; Type: SEQUENCE; Schema: public; Owner: myuser
--

CREATE SEQUENCE public.product_receipts_receipt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_receipts_receipt_id_seq OWNER TO myuser;

--
-- TOC entry 3686 (class 0 OID 0)
-- Dependencies: 251
-- Name: product_receipts_receipt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myuser
--

ALTER SEQUENCE public.product_receipts_receipt_id_seq OWNED BY public.product_receipts.receipt_id;


--
-- TOC entry 232 (class 1259 OID 25218)
-- Name: products; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public.products (
    product_id integer NOT NULL,
    seller_id integer NOT NULL,
    category_id integer NOT NULL,
    winner_id integer,
    name character varying(255) NOT NULL,
    price_start numeric(15,2) NOT NULL,
    price_step numeric(15,2) NOT NULL,
    price_buy_now numeric(15,2),
    price_current numeric(15,2),
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    is_auto_extend boolean DEFAULT false,
    status public.product_status DEFAULT 'ACTIVE'::public.product_status,
    tsv tsvector,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    allow_first_time_bidder boolean DEFAULT true,
    min_positive_rate_allow double precision DEFAULT 80.0
);


ALTER TABLE public.products OWNER TO myuser;

--
-- TOC entry 231 (class 1259 OID 25217)
-- Name: products_product_id_seq; Type: SEQUENCE; Schema: public; Owner: myuser
--

CREATE SEQUENCE public.products_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_product_id_seq OWNER TO myuser;

--
-- TOC entry 3687 (class 0 OID 0)
-- Dependencies: 231
-- Name: products_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myuser
--

ALTER SEQUENCE public.products_product_id_seq OWNED BY public.products.product_id;


--
-- TOC entry 246 (class 1259 OID 25374)
-- Name: upgrade_requests; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public.upgrade_requests (
    request_id integer NOT NULL,
    user_id integer NOT NULL,
    reason text,
    status public.request_status DEFAULT 'PENDING'::public.request_status,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.upgrade_requests OWNER TO myuser;

--
-- TOC entry 245 (class 1259 OID 25373)
-- Name: upgrade_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: myuser
--

CREATE SEQUENCE public.upgrade_requests_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.upgrade_requests_request_id_seq OWNER TO myuser;

--
-- TOC entry 3688 (class 0 OID 0)
-- Dependencies: 245
-- Name: upgrade_requests_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myuser
--

ALTER SEQUENCE public.upgrade_requests_request_id_seq OWNED BY public.upgrade_requests.request_id;


--
-- TOC entry 228 (class 1259 OID 25188)
-- Name: users; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(100) NOT NULL,
    address text,
    dob date,
    role public.user_role DEFAULT 'BIDDER'::public.user_role,
    is_verified boolean DEFAULT false,
    refresh_token text,
    otp_code character varying(10),
    otp_expiry timestamp with time zone,
    seller_exp_date timestamp with time zone,
    positive_rating integer DEFAULT 0,
    negative_rating integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO myuser;

--
-- TOC entry 227 (class 1259 OID 25187)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: myuser
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO myuser;

--
-- TOC entry 3689 (class 0 OID 0)
-- Dependencies: 227
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myuser
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 244 (class 1259 OID 25357)
-- Name: watchlists; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public.watchlists (
    user_id integer NOT NULL,
    product_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.watchlists OWNER TO myuser;

--
-- TOC entry 3433 (class 2604 OID 25299)
-- Name: auto_bids auto_bid_id; Type: DEFAULT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.auto_bids ALTER COLUMN auto_bid_id SET DEFAULT nextval('public.auto_bids_auto_bid_id_seq'::regclass);


--
-- TOC entry 3430 (class 2604 OID 25279)
-- Name: bids bid_id; Type: DEFAULT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.bids ALTER COLUMN bid_id SET DEFAULT nextval('public.bids_bid_id_seq'::regclass);


--
-- TOC entry 3417 (class 2604 OID 25208)
-- Name: categories category_id; Type: DEFAULT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.categories ALTER COLUMN category_id SET DEFAULT nextval('public.categories_category_id_seq'::regclass);


--
-- TOC entry 3437 (class 2604 OID 25335)
-- Name: feedbacks feedback_id; Type: DEFAULT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.feedbacks ALTER COLUMN feedback_id SET DEFAULT nextval('public.feedbacks_feedback_id_seq'::regclass);


--
-- TOC entry 3446 (class 2604 OID 25430)
-- Name: messages message_id; Type: DEFAULT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.messages ALTER COLUMN message_id SET DEFAULT nextval('public.messages_message_id_seq'::regclass);


--
-- TOC entry 3443 (class 2604 OID 25403)
-- Name: product_comments comment_id; Type: DEFAULT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.product_comments ALTER COLUMN comment_id SET DEFAULT nextval('public.product_comments_comment_id_seq'::regclass);


--
-- TOC entry 3425 (class 2604 OID 25248)
-- Name: product_descriptions desc_id; Type: DEFAULT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.product_descriptions ALTER COLUMN desc_id SET DEFAULT nextval('public.product_descriptions_desc_id_seq'::regclass);


--
-- TOC entry 3427 (class 2604 OID 25263)
-- Name: product_images image_id; Type: DEFAULT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.product_images ALTER COLUMN image_id SET DEFAULT nextval('public.product_images_image_id_seq'::regclass);


--
-- TOC entry 3449 (class 2604 OID 26099)
-- Name: product_receipts receipt_id; Type: DEFAULT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.product_receipts ALTER COLUMN receipt_id SET DEFAULT nextval('public.product_receipts_receipt_id_seq'::regclass);


--
-- TOC entry 3419 (class 2604 OID 25221)
-- Name: products product_id; Type: DEFAULT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.products ALTER COLUMN product_id SET DEFAULT nextval('public.products_product_id_seq'::regclass);


--
-- TOC entry 3440 (class 2604 OID 25377)
-- Name: upgrade_requests request_id; Type: DEFAULT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.upgrade_requests ALTER COLUMN request_id SET DEFAULT nextval('public.upgrade_requests_request_id_seq'::regclass);


--
-- TOC entry 3410 (class 2604 OID 25191)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 3479 (class 2606 OID 25302)
-- Name: auto_bids auto_bids_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.auto_bids
    ADD CONSTRAINT auto_bids_pkey PRIMARY KEY (auto_bid_id);


--
-- TOC entry 3481 (class 2606 OID 25304)
-- Name: auto_bids auto_bids_product_id_bidder_id_key; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.auto_bids
    ADD CONSTRAINT auto_bids_product_id_bidder_id_key UNIQUE (product_id, bidder_id);


--
-- TOC entry 3475 (class 2606 OID 25284)
-- Name: bids bids_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_pkey PRIMARY KEY (bid_id);


--
-- TOC entry 3483 (class 2606 OID 25320)
-- Name: blocked_bidders blocked_bidders_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.blocked_bidders
    ADD CONSTRAINT blocked_bidders_pkey PRIMARY KEY (product_id, user_id);


--
-- TOC entry 3462 (class 2606 OID 25211)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (category_id);


--
-- TOC entry 3485 (class 2606 OID 25341)
-- Name: feedbacks feedbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_pkey PRIMARY KEY (feedback_id);


--
-- TOC entry 3493 (class 2606 OID 25436)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (message_id);


--
-- TOC entry 3491 (class 2606 OID 25409)
-- Name: product_comments product_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.product_comments
    ADD CONSTRAINT product_comments_pkey PRIMARY KEY (comment_id);


--
-- TOC entry 3471 (class 2606 OID 25253)
-- Name: product_descriptions product_descriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.product_descriptions
    ADD CONSTRAINT product_descriptions_pkey PRIMARY KEY (desc_id);


--
-- TOC entry 3473 (class 2606 OID 25269)
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (image_id);


--
-- TOC entry 3498 (class 2606 OID 26104)
-- Name: product_receipts product_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.product_receipts
    ADD CONSTRAINT product_receipts_pkey PRIMARY KEY (receipt_id);


--
-- TOC entry 3469 (class 2606 OID 25228)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (product_id);


--
-- TOC entry 3489 (class 2606 OID 25383)
-- Name: upgrade_requests upgrade_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.upgrade_requests
    ADD CONSTRAINT upgrade_requests_pkey PRIMARY KEY (request_id);


--
-- TOC entry 3458 (class 2606 OID 25203)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3460 (class 2606 OID 25201)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3487 (class 2606 OID 25362)
-- Name: watchlists watchlists_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.watchlists
    ADD CONSTRAINT watchlists_pkey PRIMARY KEY (user_id, product_id);


--
-- TOC entry 3476 (class 1259 OID 25392)
-- Name: idx_bids_bidder; Type: INDEX; Schema: public; Owner: myuser
--

CREATE INDEX idx_bids_bidder ON public.bids USING btree (bidder_id);


--
-- TOC entry 3477 (class 1259 OID 25391)
-- Name: idx_bids_product; Type: INDEX; Schema: public; Owner: myuser
--

CREATE INDEX idx_bids_product ON public.bids USING btree (product_id);


--
-- TOC entry 3463 (class 1259 OID 25389)
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: myuser
--

CREATE INDEX idx_products_category ON public.products USING btree (category_id);


--
-- TOC entry 3464 (class 1259 OID 25396)
-- Name: idx_products_end_date; Type: INDEX; Schema: public; Owner: myuser
--

CREATE INDEX idx_products_end_date ON public.products USING btree (end_date);


--
-- TOC entry 3465 (class 1259 OID 25397)
-- Name: idx_products_price; Type: INDEX; Schema: public; Owner: myuser
--

CREATE INDEX idx_products_price ON public.products USING btree (price_current);


--
-- TOC entry 3466 (class 1259 OID 25390)
-- Name: idx_products_seller; Type: INDEX; Schema: public; Owner: myuser
--

CREATE INDEX idx_products_seller ON public.products USING btree (seller_id);


--
-- TOC entry 3467 (class 1259 OID 25395)
-- Name: idx_products_tsv; Type: INDEX; Schema: public; Owner: myuser
--

CREATE INDEX idx_products_tsv ON public.products USING gin (tsv);


--
-- TOC entry 3494 (class 1259 OID 26120)
-- Name: idx_receipts_buyer; Type: INDEX; Schema: public; Owner: myuser
--

CREATE INDEX idx_receipts_buyer ON public.product_receipts USING btree (buyer_id);


--
-- TOC entry 3495 (class 1259 OID 26122)
-- Name: idx_receipts_product; Type: INDEX; Schema: public; Owner: myuser
--

CREATE INDEX idx_receipts_product ON public.product_receipts USING btree (product_id);


--
-- TOC entry 3496 (class 1259 OID 26121)
-- Name: idx_receipts_seller; Type: INDEX; Schema: public; Owner: myuser
--

CREATE INDEX idx_receipts_seller ON public.product_receipts USING btree (seller_id);


--
-- TOC entry 3527 (class 2620 OID 25425)
-- Name: product_comments set_timestamp; Type: TRIGGER; Schema: public; Owner: myuser
--

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.product_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3526 (class 2620 OID 25394)
-- Name: products tsvectorupdate; Type: TRIGGER; Schema: public; Owner: myuser
--

CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.products_tsv_trigger();


--
-- TOC entry 3507 (class 2606 OID 25310)
-- Name: auto_bids auto_bids_bidder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.auto_bids
    ADD CONSTRAINT auto_bids_bidder_id_fkey FOREIGN KEY (bidder_id) REFERENCES public.users(user_id);


--
-- TOC entry 3508 (class 2606 OID 25305)
-- Name: auto_bids auto_bids_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.auto_bids
    ADD CONSTRAINT auto_bids_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE CASCADE;


--
-- TOC entry 3505 (class 2606 OID 25290)
-- Name: bids bids_bidder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_bidder_id_fkey FOREIGN KEY (bidder_id) REFERENCES public.users(user_id);


--
-- TOC entry 3506 (class 2606 OID 25285)
-- Name: bids bids_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE CASCADE;


--
-- TOC entry 3509 (class 2606 OID 25321)
-- Name: blocked_bidders blocked_bidders_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.blocked_bidders
    ADD CONSTRAINT blocked_bidders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE CASCADE;


--
-- TOC entry 3510 (class 2606 OID 25326)
-- Name: blocked_bidders blocked_bidders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.blocked_bidders
    ADD CONSTRAINT blocked_bidders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3499 (class 2606 OID 25212)
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(category_id) ON DELETE SET NULL;


--
-- TOC entry 3511 (class 2606 OID 25347)
-- Name: feedbacks feedbacks_from_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(user_id);


--
-- TOC entry 3512 (class 2606 OID 25342)
-- Name: feedbacks feedbacks_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id);



ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(user_id);



ALTER TABLE ONLY public.product_comments
    ADD CONSTRAINT fk_comment_parent FOREIGN KEY (parent_id) REFERENCES public.product_comments(comment_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.product_comments
    ADD CONSTRAINT fk_comment_product FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE CASCADE;


ALTER TABLE ONLY public.product_comments
    ADD CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;



ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_message_receiver FOREIGN KEY (receiver_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id);

ALTER TABLE ONLY public.product_descriptions
    ADD CONSTRAINT product_descriptions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE CASCADE;


ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE CASCADE;



ALTER TABLE ONLY public.product_receipts
    ADD CONSTRAINT product_receipts_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY public.product_receipts
    ADD CONSTRAINT product_receipts_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON UPDATE CASCADE ON DELETE RESTRICT;




ALTER TABLE ONLY public.product_receipts
    ADD CONSTRAINT product_receipts_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(user_id);



ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES public.users(user_id);



ALTER TABLE ONLY public.upgrade_requests
    ADD CONSTRAINT upgrade_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;



ALTER TABLE ONLY public.watchlists
    ADD CONSTRAINT watchlists_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE CASCADE;



ALTER TABLE ONLY public.watchlists
    ADD CONSTRAINT watchlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


\unrestrict N2QO4eyo4cs7W0pgRYzpgHreYWugpuu3uFTNXotajTdaJvws80sqIWrL2VFfgTo

