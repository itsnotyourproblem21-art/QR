/*
  # Calculator Memory System

  ## Purpose
  Create tables to store calculator memory and input history for real-time logging
  and persistence of user interactions with the calculator.

  ## New Tables
  
  ### `calculator_sessions`
  - `id` (uuid, primary key) - Unique session identifier
  - `test_attempt_id` (uuid, nullable) - Links to test attempt if used during exam
  - `started_at` (timestamptz) - When calculator session started
  - `ended_at` (timestamptz, nullable) - When calculator was closed
  - `created_at` (timestamptz) - Record creation timestamp

  ### `calculator_inputs`
  - `id` (uuid, primary key) - Unique input record identifier
  - `session_id` (uuid, foreign key) - References calculator_sessions
  - `input_type` (text) - Type of input: 'digit', 'operator', 'function', 'equals'
  - `input_value` (text) - The actual value pressed (e.g., '7', '+', 'sqrt')
  - `display_value` (text) - Current calculator display after this input
  - `input_timestamp` (timestamptz) - When the input occurred
  - `sequence_number` (integer) - Order of inputs in session

  ## Security
  - Enable RLS on all tables
  - Allow public insert/select for calculator functionality (no auth required during practice)
  
  ## Notes
  - Captures complete interaction history with calculator
  - Stores both individual inputs and resulting display values
  - Maintains chronological order via sequence_number
  - Can be linked to test attempts for analysis
*/

-- Create calculator_sessions table
CREATE TABLE IF NOT EXISTS calculator_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_attempt_id uuid REFERENCES qr_test_attempts(id) ON DELETE SET NULL,
  started_at timestamptz DEFAULT now() NOT NULL,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create calculator_inputs table
CREATE TABLE IF NOT EXISTS calculator_inputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES calculator_sessions(id) ON DELETE CASCADE NOT NULL,
  input_type text NOT NULL CHECK (input_type IN ('digit', 'operator', 'function', 'equals', 'clear', 'memory')),
  input_value text NOT NULL,
  display_value text NOT NULL,
  input_timestamp timestamptz DEFAULT now() NOT NULL,
  sequence_number integer NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calculator_sessions_test_attempt 
  ON calculator_sessions(test_attempt_id);

CREATE INDEX IF NOT EXISTS idx_calculator_inputs_session 
  ON calculator_inputs(session_id, sequence_number);

CREATE INDEX IF NOT EXISTS idx_calculator_inputs_timestamp 
  ON calculator_inputs(input_timestamp);

-- Enable Row Level Security
ALTER TABLE calculator_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculator_inputs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for calculator_sessions
-- Allow anyone to insert and read their own sessions (public calculator)
CREATE POLICY "Allow public insert on calculator_sessions"
  ON calculator_sessions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public select on calculator_sessions"
  ON calculator_sessions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public update on calculator_sessions"
  ON calculator_sessions
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for calculator_inputs
CREATE POLICY "Allow public insert on calculator_inputs"
  ON calculator_inputs
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public select on calculator_inputs"
  ON calculator_inputs
  FOR SELECT
  TO public
  USING (true);

-- Create function to get session history
CREATE OR REPLACE FUNCTION get_calculator_session_history(session_uuid uuid)
RETURNS TABLE (
  input_type text,
  input_value text,
  display_value text,
  input_timestamp timestamptz,
  sequence_number integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.input_type,
    ci.input_value,
    ci.display_value,
    ci.input_timestamp,
    ci.sequence_number
  FROM calculator_inputs ci
  WHERE ci.session_id = session_uuid
  ORDER BY ci.sequence_number ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;