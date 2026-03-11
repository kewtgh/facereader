# Compatibility shim for Jekyll 3.x / Liquid 4 on Ruby 3.2+ and 4.x,
# where Object#tainted? was removed.
unless "".respond_to?(:tainted?)
  class Object
    def tainted?
      false
    end
  end
end
