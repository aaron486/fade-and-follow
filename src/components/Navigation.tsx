import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Users, User, MessageSquare, Newspaper, UserPlus } from "lucide-react";
import fadeLogo from "@/assets/fade-logo.png";

export const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading, userProfile } = useAuth();
  
  const displayName = userProfile?.display_name || userProfile?.username || user?.email?.split('@')[0] || 'User';
  const avatarUrl = userProfile?.avatar_url;


  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-logo fade-text-gradient tracking-wider">FADE</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#leaderboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Leaderboard
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {!loading && (
              user ? (
                <>
                  <Link to="/bets">
                    <Button variant="ghost" size="sm">
                      <Users className="w-4 h-4 mr-2" />
                      My Bets
                    </Button>
                  </Link>
                  <Link to="/feed">
                    <Button variant="ghost" size="sm">
                      <Newspaper className="w-4 h-4 mr-2" />
                      Feed
                    </Button>
                  </Link>
                  <Link to="/friends">
                    <Button variant="ghost" size="sm">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Friends
                    </Button>
                  </Link>
                  <Link to="/chat">
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Messages
                    </Button>
                  </Link>
                  <Link to="/groups">
                    <Button variant="ghost" size="sm">
                      <Users className="w-4 h-4 mr-2" />
                      Groups
                    </Button>
                  </Link>
                  <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <span className="text-sm text-muted-foreground hidden lg:block">
                      {displayName}
                    </span>
                    <Avatar className="h-9 w-9 border-2 border-primary/20">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    asChild
                    className="border-primary/50 text-primary hover:bg-primary/10 backdrop-blur-sm"
                  >
                    <Link to="/auth">Sign In</Link>
                  </Button>
                  <Button className="fade-gradient hover:opacity-90 transition-all fade-glow" asChild>
                    <Link to="/auth">Get Started</Link>
                  </Button>
                </>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center">
              <span className={`bg-foreground block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'}`}></span>
              <span className={`bg-foreground block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`bg-foreground block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'}`}></span>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-card border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#leaderboard" className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
                Leaderboard
              </a>
              <div className="flex flex-col space-y-2 px-3 py-2">
                {!loading && (
                  user ? (
                    <>
                      <Link to="/bets">
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <Users className="w-4 h-4 mr-2" />
                          My Bets
                        </Button>
                      </Link>
                      <Link to="/feed">
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <Newspaper className="w-4 h-4 mr-2" />
                          Feed
                        </Button>
                      </Link>
                      <Link to="/friends">
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <UserPlus className="w-4 h-4 mr-2" />
                          Friends
                        </Button>
                      </Link>
                      <Link to="/chat">
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Messages
                        </Button>
                      </Link>
                      <Link to="/groups">
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <Users className="w-4 h-4 mr-2" />
                          Groups
                        </Button>
                      </Link>
                      <Link to="/profile" className="block px-3 py-2">
                        <div className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 transition-colors">
                          <Avatar className="h-10 w-10 border-2 border-primary/20">
                            <AvatarImage src={avatarUrl || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                              {displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{displayName}</span>
                            <span className="text-xs text-muted-foreground">View Profile</span>
                          </div>
                        </div>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        asChild
                        className="border-primary text-primary hover:bg-primary/10"
                      >
                        <Link to="/auth">Sign In</Link>
                      </Button>
                      <Button className="fade-gradient" asChild>
                        <Link to="/auth">Get Started</Link>
                      </Button>
                    </>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;