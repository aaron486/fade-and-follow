-- Allow users to view all user records for leaderboard purposes
CREATE POLICY "User records are publicly viewable for leaderboard"
ON public.user_records
FOR SELECT
USING (true);