-- Create triggers to automatically update stats when bets are created or settled
CREATE TRIGGER update_user_stats_on_bet_insert
  AFTER INSERT ON public.bets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_bet_result_change();

CREATE TRIGGER update_user_stats_on_bet_update
  AFTER UPDATE ON public.bets
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.handle_bet_result_change();

CREATE TRIGGER update_user_stats_on_bet_delete
  AFTER DELETE ON public.bets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_bet_result_change();

-- Enable realtime for user_records so stats update live
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_records;

-- Enable realtime for bets table so UI updates when bets settle
ALTER PUBLICATION supabase_realtime ADD TABLE public.bets;