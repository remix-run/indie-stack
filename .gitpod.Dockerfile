FROM gitpod/workspace-full

# Install Fly
RUN curl -L https://fly.io/install.sh | sh \
  && export FLYCTL_INSTALL="/home/gitpod/.fly" \
  && export PATH="$FLYCTL_INSTALL/bin:$PATH"

# Install GitHub CLI
RUN brew install gh
