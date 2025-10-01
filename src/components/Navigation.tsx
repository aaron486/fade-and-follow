import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Users, User, MessageSquare, Newspaper } from "lucide-react";

export const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading } = useAuth();


  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-black fade-text-gradient">FADE</span>
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
                  <Link to="/profile">
                    <Button variant="ghost" size="sm">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Button>
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    Welcome back!
                  </span>
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
                      <Link to="/profile">
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <User className="w-4 h-4 mr-2" />
                          Profile
                        </Button>
                      </Link>
                      <span className="text-sm text-muted-foreground px-3">
                        Welcome back!
                      </span>
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