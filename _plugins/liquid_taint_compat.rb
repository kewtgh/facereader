# Compatibility shim for Liquid 4 on Ruby 4.0, where Object#tainted? and
# Object#untaint were removed but Liquid 4 still calls them while rendering.
unless "".respond_to?(:tainted?)
  class Object
    def tainted?
      false
    end
  end
end

unless "".respond_to?(:untaint)
  class Object
    def untaint
      self
    end
  end
end
