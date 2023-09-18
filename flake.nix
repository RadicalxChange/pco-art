{
  description = "A basic flake with a shell";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-23.05-darwin";
  inputs.nixpkgs-unstable.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

  outputs = { self, nixpkgs, flake-utils, nixpkgs-unstable }:
    flake-utils.lib.eachDefaultSystem (system: 
      let 
        pkgs = import nixpkgs {
          overlays = [ (final: prev: {
                nodejs = prev.nodejs-18_x;
          }) ];
          inherit system;
        };
        pkgs-unstable = import nixpkgs-unstable { inherit system; };
    in {
      devShells.default = pkgs.mkShell {
        nativeBuildInputs = [ pkgs.yarn pkgs.nodejs-18_x pkgs.git-cliff pkgs.python310Packages.crytic-compile pkgs.solc-select pkgs.slither-analyzer pkgs-unstable.echidna ];
        buildInputs = [ ];
      };
    });
}
