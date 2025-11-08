/*
  # Create Quantitative Reasoning Test Tables

  ## Overview
  This migration creates tables for storing OAT Quantitative Reasoning test data, including questions, 
  exhibits, user test attempts, and performance analytics.

  ## New Tables
  
  ### `qr_questions`
  Stores all quantitative reasoning questions with their content and metadata.
  - `id` (uuid, primary key) - Unique question identifier
  - `question_number` (integer) - Question order in the test (1-40)
  - `stem` (text) - The question text
  - `question_type` (text) - Either 'multiple_choice' or 'numeric_entry'
  - `choices` (jsonb) - Array of answer choices for multiple choice questions
  - `correct_answer` (text) - Correct answer (choice index for MC, numeric value for NE)
  - `topic` (text) - Question topic category (e.g., 'data_interpretation', 'geometry', 'statistics')
  - `exhibit_id` (uuid, nullable) - Reference to associated exhibit
  - `created_at` (timestamptz) - Record creation timestamp

  ### `qr_exhibits`
  Stores exhibits (charts, graphs, tables) referenced by questions.
  - `id` (uuid, primary key) - Unique exhibit identifier
  - `title` (text) - Exhibit title
  - `type` (text) - Exhibit type (e.g., 'chart', 'graph', 'table', 'diagram')
  - `image_url` (text, nullable) - URL to exhibit image
  - `data` (jsonb, nullable) - Structured data for dynamic exhibits
  - `created_at` (timestamptz) - Record creation timestamp

  ### `qr_test_attempts`
  Tracks user test sessions and overall performance.
  - `id` (uuid, primary key) - Unique attempt identifier
  - `user_id` (uuid, nullable) - User identifier (null for anonymous users)
  - `started_at` (timestamptz) - Test start time
  - `completed_at` (timestamptz, nullable) - Test completion time
  - `time_limit_seconds` (integer) - Allocated time in seconds (2700 or 4050 with accommodation)
  - `time_used_seconds` (integer, nullable) - Actual time used
  - `has_accommodation` (boolean) - Whether 1.5x time was enabled
  - `has_prometric_delay` (boolean) - Whether delay simulation was enabled
  - `score` (integer, nullable) - Total correct answers
  - `total_questions` (integer) - Total questions in test (40)
  - `status` (text) - Test status: 'in_progress', 'completed', 'abandoned'
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record last update timestamp

  ### `qr_user_answers`
  Stores individual question answers for each test attempt.
  - `id` (uuid, primary key) - Unique answer record identifier
  - `attempt_id` (uuid) - Reference to test attempt
  - `question_id` (uuid) - Reference to question
  - `question_number` (integer) - Question number for quick reference
  - `user_answer` (text, nullable) - User's selected answer
  - `is_correct` (boolean, nullable) - Whether answer is correct
  - `is_marked` (boolean) - Whether question was marked for review
  - `time_spent_seconds` (integer, nullable) - Time spent on this question
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record last update timestamp

  ## Security
  - All tables have RLS enabled
  - Users can read all questions and exhibits (public data)
  - Users can only access their own test attempts and answers
  - Anonymous users can create and read their own attempts using session-based identification

  ## Indexes
  - Question number index for fast ordered retrieval
  - Attempt status and user_id indexes for filtering user's tests
  - Answer lookup by attempt_id and question_number for quick access
*/

-- Create exhibits table first (referenced by questions)
CREATE TABLE IF NOT EXISTS qr_exhibits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL,
  image_url text,
  data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS qr_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_number integer NOT NULL UNIQUE,
  stem text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('multiple_choice', 'numeric_entry')),
  choices jsonb,
  correct_answer text NOT NULL,
  topic text NOT NULL,
  exhibit_id uuid REFERENCES qr_exhibits(id),
  created_at timestamptz DEFAULT now()
);

-- Create test attempts table
CREATE TABLE IF NOT EXISTS qr_test_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  time_limit_seconds integer NOT NULL DEFAULT 2700,
  time_used_seconds integer,
  has_accommodation boolean DEFAULT false,
  has_prometric_delay boolean DEFAULT true,
  score integer,
  total_questions integer DEFAULT 40,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user answers table
CREATE TABLE IF NOT EXISTS qr_user_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES qr_test_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES qr_questions(id),
  question_number integer NOT NULL,
  user_answer text,
  is_correct boolean,
  is_marked boolean DEFAULT false,
  time_spent_seconds integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(attempt_id, question_number)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_qr_questions_number ON qr_questions(question_number);
CREATE INDEX IF NOT EXISTS idx_qr_questions_topic ON qr_questions(topic);
CREATE INDEX IF NOT EXISTS idx_qr_attempts_user_id ON qr_test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_attempts_status ON qr_test_attempts(status);
CREATE INDEX IF NOT EXISTS idx_qr_answers_attempt ON qr_user_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_qr_answers_question_num ON qr_user_answers(attempt_id, question_number);

-- Enable Row Level Security
ALTER TABLE qr_exhibits ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_user_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for qr_exhibits (public read)
CREATE POLICY "Anyone can view exhibits"
  ON qr_exhibits FOR SELECT
  USING (true);

-- RLS Policies for qr_questions (public read)
CREATE POLICY "Anyone can view questions"
  ON qr_questions FOR SELECT
  USING (true);

-- RLS Policies for qr_test_attempts
CREATE POLICY "Users can view own attempts"
  ON qr_test_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own attempts"
  ON qr_test_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attempts"
  ON qr_test_attempts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous users can create attempts"
  ON qr_test_attempts FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Anonymous users can view their attempts"
  ON qr_test_attempts FOR SELECT
  TO anon
  USING (user_id IS NULL);

CREATE POLICY "Anonymous users can update their attempts"
  ON qr_test_attempts FOR UPDATE
  TO anon
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

-- RLS Policies for qr_user_answers
CREATE POLICY "Users can view own answers"
  ON qr_user_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM qr_test_attempts
      WHERE qr_test_attempts.id = qr_user_answers.attempt_id
      AND qr_test_attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own answers"
  ON qr_user_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM qr_test_attempts
      WHERE qr_test_attempts.id = qr_user_answers.attempt_id
      AND qr_test_attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own answers"
  ON qr_user_answers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM qr_test_attempts
      WHERE qr_test_attempts.id = qr_user_answers.attempt_id
      AND qr_test_attempts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM qr_test_attempts
      WHERE qr_test_attempts.id = qr_user_answers.attempt_id
      AND qr_test_attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "Anonymous users can view their answers"
  ON qr_user_answers FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM qr_test_attempts
      WHERE qr_test_attempts.id = qr_user_answers.attempt_id
      AND qr_test_attempts.user_id IS NULL
    )
  );

CREATE POLICY "Anonymous users can create answers"
  ON qr_user_answers FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM qr_test_attempts
      WHERE qr_test_attempts.id = qr_user_answers.attempt_id
      AND qr_test_attempts.user_id IS NULL
    )
  );

CREATE POLICY "Anonymous users can update their answers"
  ON qr_user_answers FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM qr_test_attempts
      WHERE qr_test_attempts.id = qr_user_answers.attempt_id
      AND qr_test_attempts.user_id IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM qr_test_attempts
      WHERE qr_test_attempts.id = qr_user_answers.attempt_id
      AND qr_test_attempts.user_id IS NULL
    )
  );